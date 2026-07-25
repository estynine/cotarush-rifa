import { AdminTitle } from "@/components/admin/admin";

export default function NewCampaignPage() {
  return (
    <>
      <AdminTitle title="Nova campanha" description="Checklist de compliance obrigatorio antes da publicacao." />
      <form className="panel mt-6 grid gap-3 p-5 md:grid-cols-2">
        {["Nome", "Slug", "Titulo", "Subtitulo", "Responsavel", "Documento responsavel", "Autorizacao", "Preco por cota"].map((label) => (
          <label key={label} className="grid gap-2 text-sm font-bold text-zinc-300">
            {label}
            <input className="form-input" />
          </label>
        ))}
        <label className="grid gap-2 text-sm font-bold text-zinc-300 md:col-span-2">
          Regulamento
          <textarea className="form-input min-h-32" />
        </label>
        <button className="btn-primary md:col-span-2" type="button">Salvar rascunho</button>
      </form>
    </>
  );
}
