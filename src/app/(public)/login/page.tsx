import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default async function LoginPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ returnTo?: string; error?: string }> }>) {
  const { returnTo = "/conta", error } = await searchParams;

  return (
    <>
      <AuthCard
        title="Entrar"
        subtitle="Acesse sua conta para comprar cotas, ver pedidos e acompanhar seus numeros."
      >
        {error === "invalid" ? (
          <p className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            E-mail ou senha invalidos.
          </p>
        ) : null}
        <form className="grid gap-3" action="/api/auth/login" method="post">
          <input type="hidden" name="returnTo" value={returnTo.startsWith("/admin") ? "/conta" : returnTo} />
          <input className="form-input" name="email" type="email" placeholder="E-mail" required />
          <input className="form-input" name="password" type="password" placeholder="Senha" required />
          <button className="btn-primary w-full" type="submit">
            Entrar
          </button>
        </form>
        <form className="mt-3" action="/api/auth/demo" method="post">
          <input type="hidden" name="role" value="participant" />
          <input type="hidden" name="adminCode" value="A001" />
          <input type="hidden" name="returnTo" value="/adm/A001/setup-gamer-dos-sonhos" />
          <button className="btn-secondary w-full" type="submit">
            Entrar demo participante
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-400">
          <Link href="/cadastro" className="text-cyan-200">
            Criar conta
          </Link>
          <Link href="/recuperar-senha" className="text-cyan-200">
            Recuperar senha
          </Link>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4">
          <Link className="btn-secondary w-full" href="/admin/login">
            Administrador
          </Link>
        </div>
      </AuthCard>
    </>
  );
}

export function AuthCard({ title, subtitle, children }: Readonly<{ title: string; subtitle: string; children: React.ReactNode }>) {
  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="panel p-6">
        <Logo />
        <h1 className="mt-6 text-3xl font-black text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
