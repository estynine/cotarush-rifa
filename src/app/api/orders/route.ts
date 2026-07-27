import { NextResponse } from "next/server";
import { createPixPayment } from "@/lib/mercadopago";
import { createOrderSchema, validateQuantityAgainstCampaign } from "@/lib/validations";
import { calculateOrderTotal } from "@/lib/format";
import { demoCampaigns } from "@/lib/demo-data";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const input = createOrderSchema.parse(body);

    if (!hasSupabaseEnv()) {
      const campaign = demoCampaigns.find((item) => item.id === input.campaignId && (!user.ownerAdminId || item.ownerAdminId === user.ownerAdminId));
      if (!campaign) return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });

      validateQuantityAgainstCampaign(input.quantity, campaign.maxNumbersPerOrder);
      const totalCents = calculateOrderTotal(campaign.pricePerNumberCents, input.quantity);
      const split = calculatePlatformSplit(totalCents);
      const orderId = `demo-${Date.now()}`;
      await createPixPayment({
        orderId,
        amountCents: totalCents,
        description: `${campaign.name} - ${input.quantity} cotas`,
        payerEmail: user.email ?? "demo@cotarush.local",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

      return NextResponse.json({ orderId, split });
    }

    const supabase = getServiceSupabase();
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, owner_admin_id, name, price_per_number_cents, max_numbers_per_order, status")
      .eq("id", input.campaignId)
      .single();

    if (campaignError || !campaign || campaign.status !== "active") {
      return NextResponse.json({ error: "Campanha indisponivel." }, { status: 400 });
    }
    if (user.role === "participant" && campaign.owner_admin_id !== user.ownerAdminId) {
      return NextResponse.json({ error: "Campanha nao pertence ao ADM do participante." }, { status: 403 });
    }

    validateQuantityAgainstCampaign(input.quantity, campaign.max_numbers_per_order);
    const totalCents = calculateOrderTotal(campaign.price_per_number_cents, input.quantity);
    const split = calculatePlatformSplit(totalCents);
    const readableCode = `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        campaign_id: input.campaignId,
        owner_admin_id: campaign.owner_admin_id,
        participant_id: user.id,
        readable_code: readableCode,
        quantity: input.quantity,
        unit_price_cents: campaign.price_per_number_cents,
        total_cents: totalCents,
        platform_fee_cents: split.platformFeeCents,
        admin_net_cents: split.adminNetCents,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) throw orderError;

    const pix = await createPixPayment({
      orderId: order.id,
      amountCents: totalCents,
      description: `${campaign.name} - ${input.quantity} cotas`,
      payerEmail: user.email ?? "participante@cotarush.local",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "mercado_pago",
      status: pix.status,
      amount_cents: totalCents,
      platform_fee_cents: split.platformFeeCents,
      admin_net_cents: split.adminNetCents,
      pix_copy_paste: pix.copyPasteCode,
      pix_qr_code_base64: pix.qrCodeBase64,
      expires_at: pix.expiresAt,
    });

    await supabase.from("order_revenue_splits").insert({
      order_id: order.id,
      owner_admin_id: campaign.owner_admin_id,
      platform_fee_cents: split.platformFeeCents,
      admin_net_cents: split.adminNetCents,
      status: "pending",
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao criar pedido." }, { status: 400 });
  }
}

function calculatePlatformSplit(totalCents: number) {
  const platformFeeCents = Math.floor(totalCents / 2);
  return {
    platformFeeCents,
    adminNetCents: totalCents - platformFeeCents,
  };
}
