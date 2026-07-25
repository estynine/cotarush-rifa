import { AdminTitle, AdminDataTable } from "@/components/admin/admin";
import { demoAllocations, demoProfiles } from "@/lib/demo-data";
import { formatDateTime, formatNumber } from "@/lib/format";

export default function AdminNumbersPage() {
  return (
    <>
      <AdminTitle title="Numeros distribuidos" description="Consulta administrativa por campanha, proprietario, pedido, origem e estado." />
      <form className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-[1fr_auto]">
        <input className="form-input" placeholder="Digite um numero" />
        <button className="btn-primary" type="button">Consultar</button>
      </form>
      <AdminDataTable
        rows={demoAllocations.map((allocation) => ({
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
