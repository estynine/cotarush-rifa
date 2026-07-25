import { MercadoPagoConfig, Payment } from "mercadopago";
import type { PixPayment } from "./types";

function getPaymentClient() {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Error("Mercado Pago nao configurado.");
  }

  return new Payment(new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN }));
}

export async function createPixPayment(input: {
  orderId: string;
  amountCents: number;
  description: string;
  payerEmail: string;
  expiresAt: string;
}): Promise<PixPayment> {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return {
      orderId: input.orderId,
      expiresAt: input.expiresAt,
      copyPasteCode:
        "00020126580014br.gov.bcb.pix0136demo-cotarush-pix-chave52040000530398654041.005802BR5920CotaRush Demonstracao6009Sao Paulo62070503***6304DEMO",
      status: "pending",
    };
  }

  const response = await getPaymentClient().create({
    body: {
      transaction_amount: input.amountCents / 100,
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.orderId,
      date_of_expiration: input.expiresAt,
      payer: {
        email: input.payerEmail,
      },
      notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
    },
  });

  return {
    orderId: input.orderId,
    expiresAt: input.expiresAt,
    qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
    copyPasteCode: response.point_of_interaction?.transaction_data?.qr_code ?? "",
    status: "pending",
  };
}

export async function getMercadoPagoPayment(paymentId: string) {
  return getPaymentClient().get({ id: paymentId });
}

export async function verifyMercadoPagoWebhookSignature(request: Request, body: string): Promise<boolean> {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${requestId}.${body}`));
  const expected = Array.from(new Uint8Array(signed))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return signature.includes(expected);
}
