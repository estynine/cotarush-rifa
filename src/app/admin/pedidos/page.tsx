import { AdminShell, AdminTitle, OrdersAdminRows } from "@/components/admin";
import { demoOrders } from "@/lib/demo-data";

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <AdminTitle title="Pedidos" description="Pedidos legiveis para suporte, status de pagamento e processamento de numeros." />
      <OrdersAdminRows orders={demoOrders} />
    </AdminShell>
  );
}
