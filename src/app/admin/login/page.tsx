import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string; created?: string }> }>) {
  const { error, created } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#050507] px-4 text-zinc-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_34%),linear-gradient(180deg,#050507,#101018)]" />
      <section className="panel w-full max-w-md p-6">
        <Logo />
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Acesso administrativo</p>
        <h1 className="mt-2 text-3xl font-black text-white">Painel do ADM</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Area restrita para controle de campanhas, pagamentos, participantes, premios e auditoria.
        </p>
        {error ? (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            Acesso restrito ao administrador autorizado.
          </p>
        ) : null}
        {created === "1" ? (
          <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
            Conta ADM criada. Entre com o e-mail e a senha cadastrados.
          </p>
        ) : null}
        <form className="mt-6 grid gap-3" action="/api/auth/login" method="post">
          <input type="hidden" name="returnTo" value="/admin" />
          <input className="form-input" name="email" type="email" placeholder="E-mail do ADM" required />
          <input className="form-input" name="password" type="password" placeholder="Senha" required />
          <button className="btn-primary w-full" type="submit">
            Entrar no painel
          </button>
        </form>
        <form className="mt-3" action="/api/auth/demo" method="post">
          <input type="hidden" name="role" value="admin" />
          <input type="hidden" name="returnTo" value="/admin" />
          <button className="btn-secondary w-full" type="submit">
            Entrar demo ADM
          </button>
        </form>
        <Link className="btn-secondary mt-3 w-full" href="/login">
          Voltar
        </Link>
        <Link className="mt-4 block text-center text-sm font-bold text-cyan-200" href="/admin/cadastro">
          Criar conta ADM
        </Link>
      </section>
    </main>
  );
}
