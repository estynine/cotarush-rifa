import { AdminShell, AdminTitle, ConfirmActionDialog, PrizesAdminRows } from "@/components/admin";
import { demoInstantPrizes } from "@/lib/demo-data";

export default function AdminInstantPrizesPage() {
  return (
    <AdminShell>
      <AdminTitle title="Numeros premiados" description="Ativacao individual, reserva quando desativado e bloqueio apos encontrado." />
      <div className="mt-6">
        <ConfirmActionDialog />
      </div>
      <PrizesAdminRows prizes={demoInstantPrizes} />
    </AdminShell>
  );
}
