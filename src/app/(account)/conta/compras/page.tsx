import { OrdersTable } from "@/components/account/account";
import { demoOrders } from "@/lib/demo-data";
import { requireUser } from "@/lib/auth";

export default async function AccountOrdersPage() {
  const user = await requireUser();
  const orders = demoOrders.filter((order) => order.participantId === user.id);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-white">Meus pedidos</h1>
        <div className="mt-6">
          <OrdersTable orders={orders} />
        </div>
      </section>
    </>
  );
}
