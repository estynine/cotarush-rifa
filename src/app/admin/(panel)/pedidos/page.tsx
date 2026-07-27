import { AdminTitle, OrdersAdminRows } from "@/components/admin/admin";
import { demoOrders } from "@/lib/demo-data";
import { requireAdmin } from "@/lib/auth";

export default async function AdminOrdersPage() {
  const admin = await requireAdmin();
  const orders = demoOrders.filter((order) => order.ownerAdminId === admin.ownerAdminId);

  return (
    <>
      <AdminTitle title="Pedidos" description="Pedidos legiveis para suporte, status de pagamento e processamento de numeros." />
      <OrdersAdminRows orders={orders} />
    </>
  );
}
