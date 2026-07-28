import Link from "next/link";
import { AdminSignupForm } from "@/components/admin/admin-signup-form";
import { Logo } from "@/components/shared/logo";

export const dynamic = "force-dynamic";

export default async function AdminSignupPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#050507] px-4 py-6 text-zinc-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_34%),linear-gradient(180deg,#050507,#101018)]" />
      <section className="panel mx-auto w-full max-w-md p-5">
        <Logo />
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Cadastro administrativo</p>
        <h1 className="mt-2 text-3xl font-black text-white">Criar conta ADM</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Leia o contrato, aceite as responsabilidades e crie a conta administrativa.
        </p>
        {error ? (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            Nao foi possivel criar a conta ADM. Confira os dados e aceite o contrato.
          </p>
        ) : null}
        <div className="mt-6">
          <AdminSignupForm />
        </div>
        <Link className="btn-secondary mt-3 w-full" href="/admin/login">
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
