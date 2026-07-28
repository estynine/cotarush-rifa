import { AdminTitle, ConfirmActionDialog } from "@/components/admin/admin";
import { demoSocialLinks } from "@/lib/demo-data";

export default async function AdminSettingsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ status?: string; error?: string }> }>) {
  const { status, error } = await searchParams;

  return (
    <>
      <AdminTitle title="Configuracoes" description="Redes sociais, suporte, Mercado Pago, compliance e parametros globais." />
      {status === "saved" ? <p className="alert-line mt-6 border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100">Configuracao salva.</p> : null}
      {error === "support" ? <p className="alert-line mt-6 border-red-300/20 bg-red-300/[0.06] text-red-100">Nao foi possivel salvar o suporte.</p> : null}
      <form className="panel mt-6 grid gap-3 p-5 md:grid-cols-2" action="/api/admin/settings/support" method="post">
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Numero do suporte
          <input className="form-input" name="whatsappSupport" defaultValue={demoSocialLinks.whatsappSupport} placeholder="https://wa.me/5511999999999" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Nome do botao
          <input className="form-input" name="supportLabel" defaultValue={demoSocialLinks.supportLabel ?? "Suporte"} />
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-zinc-300 md:col-span-2">
          <input name="supportEnabled" type="checkbox" defaultChecked={demoSocialLinks.supportEnabled !== false} />
          Suporte ativo
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Grupo WhatsApp
          <input className="form-input" name="whatsappGroup" defaultValue={demoSocialLinks.whatsappGroup} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Instagram
          <input className="form-input" name="instagram" defaultValue={demoSocialLinks.instagram} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          TikTok
          <input className="form-input" name="tiktok" defaultValue={demoSocialLinks.tiktok} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          YouTube
          <input className="form-input" name="youtube" defaultValue={demoSocialLinks.youtube} />
        </label>
        <div className="md:col-span-2">
          <ConfirmActionDialog />
        </div>
        <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
          <button className="btn-primary" name="intent" value="save" type="submit">
            Salvar configuracoes
          </button>
          <button className="btn-secondary" name="intent" value="disable" type="submit">
            Desativar suporte
          </button>
        </div>
      </form>
    </>
  );
}
