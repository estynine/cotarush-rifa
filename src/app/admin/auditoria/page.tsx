import { AdminShell, AdminTitle, AuditHistory } from "@/components/admin";

export default function AdminAuditPage() {
  return (
    <AdminShell>
      <AdminTitle title="Auditoria" description="Logs imutaveis para alteracoes administrativas sensiveis." />
      <div className="mt-6">
        <AuditHistory />
      </div>
    </AdminShell>
  );
}
