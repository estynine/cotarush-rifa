import { AdminShell, AdminTitle, OrdersAdminRows } from "@/components/admin";
import { demoOrders } from "@/lib/demo-data";

export default function AdminPaymentsPage() {
  return (
    <AdminShell>
      <AdminTitle title="Pagamentos" description="Pix pendentes, aprovados, estornos, eventos recebidos e erros de webhook." />
      <OrdersAdminRows orders={demoOrders} />
    </AdminShell>
  );
}
