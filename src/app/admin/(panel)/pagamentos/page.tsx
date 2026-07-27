import { AdminTitle, OrdersAdminRows } from "@/components/admin/admin";
import { demoOrders } from "@/lib/demo-data";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPaymentsPage() {
  const admin = await requireAdmin();
  const orders = demoOrders.filter((order) => order.ownerAdminId === admin.ownerAdminId);

  return (
    <>
      <AdminTitle title="Pagamentos" description="Pix pendentes, aprovados, estornos, eventos recebidos e erros de webhook." />
      <OrdersAdminRows orders={orders} />
    </>
  );
}
