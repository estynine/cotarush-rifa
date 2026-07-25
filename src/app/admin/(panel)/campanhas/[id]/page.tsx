import { AdminTitle, ConfirmActionDialog } from "@/components/admin/admin";
import { demoCampaigns } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

export default async function EditCampaignPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const campaign = demoCampaigns.find((item) => item.id === id) ?? demoCampaigns[0];

  return (
    <>
      <AdminTitle title={campaign.name} description="Edicao operacional da campanha e acoes de estado com auditoria." />
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <form className="panel grid gap-3 p-5 md:grid-cols-2">
          <input className="form-input" defaultValue={campaign.title} aria-label="Titulo" />
          <input className="form-input" defaultValue={campaign.subtitle} aria-label="Subtitulo" />
          <input className="form-input" defaultValue={formatCurrency(campaign.pricePerNumberCents)} aria-label="Preco por cota" />
          <input className="form-input" defaultValue={campaign.maxNumbersPerOrder} aria-label="Maximo por pedido" />
          <textarea className="form-input min-h-32 md:col-span-2" defaultValue={campaign.regulation} aria-label="Regulamento" />
          <button className="btn-primary md:col-span-2" type="button">Salvar alteracoes</button>
        </form>
        <div className="grid gap-4">
          <ConfirmActionDialog />
          <button className="btn-secondary" type="button">Duplicar</button>
          <button className="btn-secondary" type="button">Pausar</button>
          <button className="btn-secondary" type="button">Encerrar</button>
        </div>
      </div>
    </>
  );
}
