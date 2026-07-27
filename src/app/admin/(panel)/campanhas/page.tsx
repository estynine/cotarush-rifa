import Link from "next/link";
import { AdminTitle, CampaignAdminRows, ConfirmActionDialog } from "@/components/admin/admin";
import { demoCampaigns } from "@/lib/demo-data";
import { requireAdmin } from "@/lib/auth";

export default async function AdminCampaignsPage() {
  const admin = await requireAdmin();
  const campaigns = demoCampaigns.filter((campaign) => campaign.ownerAdminId === admin.ownerAdminId);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminTitle title="Campanhas" description="Criacao, edicao, duplicacao, publicacao, pausa, encerramento e arquivamento." />
        <Link className="btn-primary" href="/admin/campanhas/nova">Nova campanha</Link>
      </div>
      <div className="mt-6">
        <ConfirmActionDialog />
      </div>
      <CampaignAdminRows campaigns={campaigns} />
    </>
  );
}
