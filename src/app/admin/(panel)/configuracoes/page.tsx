import { AdminTitle, ConfirmActionDialog } from "@/components/admin/admin";
import { demoSocialLinks } from "@/lib/demo-data";

export default function AdminSettingsPage() {
  return (
    <>
      <AdminTitle title="Configuracoes" description="Redes sociais, suporte, Mercado Pago, compliance e parametros globais." />
      <form className="panel mt-6 grid gap-3 p-5 md:grid-cols-2">
        {Object.entries(demoSocialLinks).map(([key, value]) => (
          <label key={key} className="grid gap-2 text-sm font-bold text-zinc-300">
            {key}
            <input className="form-input" defaultValue={value} />
          </label>
        ))}
        <div className="md:col-span-2">
          <ConfirmActionDialog />
        </div>
        <button className="btn-primary md:col-span-2" type="button">Salvar configuracoes</button>
      </form>
    </>
  );
}
