import { demoProfiles } from "@/lib/demo-data";

export default function AccountProfilePage() {
  const profile = demoProfiles[0];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-white">Perfil</h1>
      <p className="mt-2 text-sm text-zinc-400">Edite seus dados publicos e telefone de contato.</p>
      <form className="panel mt-6 grid gap-3 p-5 md:grid-cols-2">
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
        <button className="btn-primary md:col-span-2" type="button">
          Salvar perfil
        </button>
      </form>
    </section>
  );
}
