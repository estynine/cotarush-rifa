import { AdminTitle, AdminDataTable } from "@/components/admin/admin";
import { demoAwards } from "@/lib/demo-data";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function AdminAwardsPage() {
  return (
    <>
      <AdminTitle title="Premiacoes" description="Validacao, pagamento, entrega, comprovantes e responsavel administrativo." />
      <AdminDataTable
        rows={demoAwards.map((award) => ({
          id: award.id,
          cells: [
            award.category,
            award.number === undefined ? "-" : formatNumber(award.number),
            award.valueCents ? formatCurrency(award.valueCents) : "-",
            award.status,
            award.validationCode,
          ],
        }))}
      />
    </>
  );
}
