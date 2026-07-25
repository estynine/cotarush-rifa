import { PixPaymentCard } from "@/components/payment";
import { PublicShell } from "@/components/shell";
import { demoSocialLinks } from "@/lib/demo-data";

const demoPixExpiresAt = "2026-07-25T19:30:00.000Z";

export default async function PaymentPage({ params }: Readonly<{ params: Promise<{ orderId: string }> }>) {
  const { orderId } = await params;

  return (
    <PublicShell socialLinks={demoSocialLinks}>
      <section className="px-4 py-12">
        <PixPaymentCard
          initialPayment={{
            orderId,
            expiresAt: demoPixExpiresAt,
            copyPasteCode:
              "00020126580014br.gov.bcb.pix0136demo-cotarush-pix-chave52040000530398654041.005802BR5920CotaRush Demonstracao6009Sao Paulo62070503***6304DEMO",
            status: "pending",
          }}
        />
      </section>
    </PublicShell>
  );
}
