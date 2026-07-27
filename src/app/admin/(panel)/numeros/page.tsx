import { AdminTitle, AdminDataTable } from "@/components/admin/admin";
import { demoAllocations, demoOrders, demoProfiles } from "@/lib/demo-data";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatNumber } from "@/lib/format";

export default async function AdminNumbersPage() {
  const admin = await requireAdmin();
  const orderIds = new Set(demoOrders.filter((order) => order.ownerAdminId === admin.ownerAdminId).map((order) => order.id));
  const allocations = demoAllocations.filter((allocation) => orderIds.has(allocation.orderId));

  return (
    <>
      <AdminTitle title="Numeros distribuidos" description="Consulta administrativa por campanha, proprietario, pedido, origem e estado." />
      <form className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-[1fr_auto]">
        <input className="form-input" placeholder="Digite um numero" />
        <button className="btn-primary" type="button">Consultar</button>
      </form>
      <AdminDataTable
        rows={allocations.map((allocation) => ({
          id: allocation.id,
          cells: [
            formatNumber(allocation.number),
            demoProfiles.find((p) => p.id === allocation.participantId)?.publicName,
            allocation.orderId,
            allocation.source,
            allocation.awarded ? "Premiado" : "Normal",
            formatDateTime(allocation.allocationDate),
          ],
        }))}
      />
    </>
  );
}
