import { AdminTitle, AdminDataTable } from "@/components/admin/admin";
import { demoProfiles } from "@/lib/demo-data";
import { requireAdmin } from "@/lib/auth";

export default async function AdminParticipantsPage() {
  const admin = await requireAdmin();
  const profiles = demoProfiles.filter((profile) => profile.ownerAdminId === admin.ownerAdminId);

  return (
    <>
      <AdminTitle title="Participantes" description="Pesquisa por nome, e-mail, telefone, bloqueio justificado e observacoes." />
      <div className="mt-6 max-w-xl">
        <input className="form-input" placeholder="Pesquisar participante" />
      </div>
      <AdminDataTable
        rows={profiles.map((profile) => ({
          id: profile.id,
          cells: [profile.publicName, profile.email, profile.phone, profile.inviteCode ?? "-", profile.blocked ? "Bloqueado" : "Ativo"],
        }))}
      />
    </>
  );
}
