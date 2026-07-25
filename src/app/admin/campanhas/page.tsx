import Link from "next/link";
import { AdminShell, AdminTitle, CampaignAdminRows, ConfirmActionDialog } from "@/components/admin";
import { demoCampaigns } from "@/lib/demo-data";

export default function AdminCampaignsPage() {
  return (
    <AdminShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminTitle title="Campanhas" description="Criacao, edicao, duplicacao, publicacao, pausa, encerramento e arquivamento." />
        <Link className="btn-primary" href="/admin/campanhas/nova">Nova campanha</Link>
      </div>
      <div className="mt-6">
        <ConfirmActionDialog />
      </div>
      <CampaignAdminRows campaigns={demoCampaigns} />
    </AdminShell>
  );
}
