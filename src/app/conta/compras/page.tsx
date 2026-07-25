import { OrdersTable } from "@/components/account";
import { PublicShell } from "@/components/shell";
import { demoOrders, demoSocialLinks } from "@/lib/demo-data";

export default function AccountOrdersPage() {
  return (
    <PublicShell socialLinks={demoSocialLinks}>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-white">Meus pedidos</h1>
        <div className="mt-6">
          <OrdersTable orders={demoOrders} />
        </div>
      </section>
    </PublicShell>
  );
}
