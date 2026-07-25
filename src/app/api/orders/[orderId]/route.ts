import { NextResponse } from "next/server";
import { demoOrders } from "@/lib/demo-data";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: Readonly<{ params: Promise<{ orderId: string }> }>) {
  const { orderId } = await params;

  try {
    const user = await requireUser();

    if (!hasSupabaseEnv()) {
      const order = demoOrders.find((item) => item.id === orderId);
      return NextResponse.json({
        order,
        payment: {
          orderId,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          copyPasteCode:
            "00020126580014br.gov.bcb.pix0136demo-cotarush-pix-chave52040000530398654041.005802BR5920CotaRush Demonstracao6009Sao Paulo62070503***6304DEMO",
          status: order?.status ?? "pending",
        },
      });
    }

    const supabase = getServiceSupabase();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, participant_id, status, payments(status, pix_copy_paste, pix_qr_code_base64, expires_at)")
      .eq("id", orderId)
      .single();

    if (error || !order || order.participant_id !== user.id) {
      return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
    }

    const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
    return NextResponse.json({
      order,
      payment: {
        orderId: order.id,
        expiresAt: payment?.expires_at,
        qrCodeBase64: payment?.pix_qr_code_base64,
        copyPasteCode: payment?.pix_copy_paste,
        status: payment?.status ?? order.status,
      },
    });
  } catch {
    return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
  }
}
