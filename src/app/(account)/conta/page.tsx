import Link from "next/link";
import { demoProfiles } from "@/lib/demo-data";
import { requireUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await requireUser();
  const profile = demoProfiles.find((item) => item.id === user.id) ?? demoProfiles[0];

  return (
    <>
      <section className="px-3 py-6 sm:px-4">
        <h1 className="text-3xl font-black text-white">Minha conta</h1>
        <div className="mt-6 grid gap-5">
          <aside className="panel p-5">
            <p className="text-xl font-black text-white">{profile.publicName}</p>
            <p className="mt-1 text-sm text-zinc-400">{profile.email}</p>
            <div className="mt-5 grid gap-2">
              <Link className="btn-secondary" href="/conta/compras">Pedidos</Link>
              <Link className="btn-secondary" href="/conta/numeros">Meus numeros</Link>
              <Link className="btn-secondary" href="/conta/premiacoes">Premiacoes</Link>
              <Link className="btn-secondary" href="/conta/perfil">Perfil</Link>
            </div>
          </aside>
          <section className="panel p-5">
            <h2 className="text-xl font-black text-white">Perfil</h2>
            <form className="mt-4 grid gap-3">
              <input className="form-input" defaultValue={profile.fullName} aria-label="Nome completo" />
              <input className="form-input" defaultValue={profile.publicName} aria-label="Nome publico" />
              <input className="form-input" defaultValue={profile.phone} aria-label="Telefone" />
              <button className="btn-primary" type="button">Salvar perfil</button>
            </form>
          </section>
        </div>
      </section>
    </>
  );
}
