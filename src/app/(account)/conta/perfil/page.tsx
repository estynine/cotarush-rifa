import { demoProfiles } from "@/lib/demo-data";
import { requireUser } from "@/lib/auth";

export default async function AccountProfilePage() {
  const user = await requireUser();
  const profile = demoProfiles.find((item) => item.id === user.id) ?? demoProfiles[0];

  return (
    <section className="px-3 py-6 sm:px-4">
      <h1 className="text-3xl font-black text-white">Perfil</h1>
      <p className="mt-2 text-sm text-zinc-400">Edite seus dados publicos e telefone de contato.</p>
      <form className="panel mt-6 grid gap-3 p-5">
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Nome completo
          <input className="form-input" defaultValue={profile.fullName} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Nome publico
          <input className="form-input" defaultValue={profile.publicName} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          E-mail
          <input className="form-input" defaultValue={profile.email} disabled />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Telefone
          <input className="form-input" defaultValue={profile.phone} inputMode="numeric" />
        </label>
        <button className="btn-primary" type="button">
          Salvar perfil
        </button>
      </form>
    </section>
  );
}
