import { AdminTitle, AdminDataTable } from "@/components/admin/admin";
import { demoProfiles } from "@/lib/demo-data";

export default function AdminParticipantsPage() {
  return (
    <>
      <AdminTitle title="Participantes" description="Pesquisa por nome, e-mail, telefone, bloqueio justificado e observacoes." />
      <div className="mt-6 max-w-xl">
        <input className="form-input" placeholder="Pesquisar participante" />
      </div>
      <AdminDataTable
        rows={demoProfiles.map((profile) => ({
          id: profile.id,
          cells: [profile.publicName, profile.email, profile.phone, profile.role, profile.blocked ? "Bloqueado" : "Ativo"],
        }))}
      />
    </>
  );
}
