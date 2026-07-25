import { AdminTitle, ConfirmActionDialog, PrizesAdminRows } from "@/components/admin/admin";
import { demoInstantPrizes } from "@/lib/demo-data";

export default function AdminInstantPrizesPage() {
  return (
    <>
      <AdminTitle title="Numeros premiados" description="Ativacao individual, reserva quando desativado e bloqueio apos encontrado." />
      <div className="mt-6">
        <ConfirmActionDialog />
      </div>
      <PrizesAdminRows prizes={demoInstantPrizes} />
    </>
  );
}
