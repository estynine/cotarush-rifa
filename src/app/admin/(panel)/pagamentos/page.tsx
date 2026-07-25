import { AdminTitle, OrdersAdminRows } from "@/components/admin/admin";
import { demoOrders } from "@/lib/demo-data";

export default function AdminPaymentsPage() {
  return (
    <>
      <AdminTitle title="Pagamentos" description="Pix pendentes, aprovados, estornos, eventos recebidos e erros de webhook." />
      <OrdersAdminRows orders={demoOrders} />
    </>
  );
}
