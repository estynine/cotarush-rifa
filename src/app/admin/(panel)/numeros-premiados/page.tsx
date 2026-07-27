import { AdminTitle, ConfirmActionDialog, PrizesAdminRows } from "@/components/admin/admin";
import { InstantPrizeControlPanel } from "@/components/admin/instant-prize-controls";
import { demoCampaigns, demoInstantPrizes } from "@/lib/demo-data";
import { requireAdmin } from "@/lib/auth";

export default async function AdminInstantPrizesPage() {
  const admin = await requireAdmin();
  const campaignIds = new Set(demoCampaigns.filter((campaign) => campaign.ownerAdminId === admin.ownerAdminId).map((campaign) => campaign.id));
  const prizes = demoInstantPrizes.filter((prize) => campaignIds.has(prize.campaignId));

  return (
    <>
      <AdminTitle title="Numeros premiados" description="Controle individual ou em lote de valor, caixa, liberacao e bloqueio apos encontrado." />
      <div className="mt-6">
        <ConfirmActionDialog />
      </div>
      <InstantPrizeControlPanel prizes={prizes} />
      <PrizesAdminRows prizes={prizes} />
    </>
  );
}
