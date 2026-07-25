import { AdminTitle, OrdersAdminRows } from "@/components/admin/admin";
import { demoOrders } from "@/lib/demo-data";

export default function AdminOrdersPage() {
  return (
    <>
      <AdminTitle title="Pedidos" description="Pedidos legiveis para suporte, status de pagamento e processamento de numeros." />
      <OrdersAdminRows orders={demoOrders} />
    </>
  );
}
