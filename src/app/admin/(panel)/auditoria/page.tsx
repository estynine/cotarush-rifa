import { AdminTitle, AuditHistory } from "@/components/admin/admin";

export default function AdminAuditPage() {
  return (
    <>
      <AdminTitle title="Auditoria" description="Logs imutaveis para alteracoes administrativas sensiveis." />
      <div className="mt-6">
        <AuditHistory />
      </div>
    </>
  );
}
