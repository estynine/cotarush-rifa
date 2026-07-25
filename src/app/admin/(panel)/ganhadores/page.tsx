import { AdminTitle, AdminDataTable } from "@/components/admin/admin";
import { demoAwards } from "@/lib/demo-data";

export default function AdminWinnersPage() {
  return (
    <>
      <AdminTitle title="Ganhadores" description="Premio principal, instantaneos, menor/maior do dia e depoimentos autorizados." />
      <AdminDataTable rows={demoAwards.map((award) => ({ id: award.id, cells: [award.category, award.description, award.status] }))} />
    </>
  );
}
