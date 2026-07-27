import { AdminTitle, ConfirmActionDialog, PrizesAdminRows } from "@/components/admin/admin";
import { InstantPrizeControlPanel } from "@/components/admin/instant-prize-controls";
import { demoInstantPrizes } from "@/lib/demo-data";

export default function AdminInstantPrizesPage() {
  return (
    <>
      <AdminTitle title="Numeros premiados" description="Controle individual ou em lote de valor, caixa, liberacao e bloqueio apos encontrado." />
      <div className="mt-6">
        <ConfirmActionDialog />
      </div>
      <InstantPrizeControlPanel prizes={demoInstantPrizes} />
      <PrizesAdminRows prizes={demoInstantPrizes} />
    </>
  );
}
