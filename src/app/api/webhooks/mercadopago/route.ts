import { NextResponse } from "next/server";
import { getMercadoPagoPayment, verifyMercadoPagoWebhookSignature } from "@/lib/mercadopago";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const validSignature = await verifyMercadoPagoWebhookSignature(request, rawBody);
  if (!validSignature) {
    return NextResponse.json({ error: "Assinatura invalida." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody || "{}") as {
    id?: string;
    action?: string;
    type?: string;
    data?: { id?: string };
  };

  const eventId = payload.id ?? `${payload.action}-${payload.data?.id}`;
  if (!eventId) return NextResponse.json({ error: "Evento sem id." }, { status: 400 });

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ status: "processed-demo", eventId });
  }

  const supabase = getServiceSupabase();
  const { error: eventError } = await supabase.from("payment_events").insert({
    provider: "mercado_pago",
    provider_event_id: eventId,
    event_type: payload.type ?? payload.action ?? "unknown",
    raw_payload: payload,
    processed_at: null,
  });

  if (eventError?.code === "23505") {
    return NextResponse.json({ status: "duplicate" });
  }

  if (eventError) throw eventError;

  if (payload.type === "payment" && payload.data?.id) {
    const payment = await getMercadoPagoPayment(payload.data.id);
    const status = payment.status === "approved" ? "approved" : payment.status === "refunded" ? "refunded" : "pending";
    const orderId = payment.external_reference;

    if (orderId) {
      await supabase.rpc("process_payment_status", {
        p_order_id: orderId,
        p_provider_payment_id: String(payment.id),
        p_status: status,
        p_raw_payload: payment,
      });
    }
  }

  await supabase
    .from("payment_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider_event_id", eventId);

  return NextResponse.json({ status: "processed" });
}
