import { AuthCard } from "../login/page";

export default async function CadastroPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ admin?: string; error?: string }> }>) {
  const { admin = "", error } = await searchParams;
  const adminCode = /^[A-Za-z][0-9]{3}$/.test(admin) ? admin.toUpperCase() : "";

  return (
    <>
      <AuthCard title="Cadastro" subtitle="Crie sua conta usando o codigo do ADM que convidou voce.">
        {error === "admin-code" ? (
          <p className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            Codigo do ADM invalido ou inativo.
          </p>
        ) : null}
        {error === "signup" ? (
          <p className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            Nao foi possivel criar a conta. Confira os dados e tente novamente.
          </p>
        ) : null}
        <form className="grid gap-3" action="/api/auth/signup" method="post">
          <input className="form-input" name="fullName" placeholder="Nome completo" required />
          <input className="form-input" name="publicName" placeholder="Nome publico ou apelido" required />
          <input className="form-input" name="email" type="email" placeholder="E-mail" required />
          <input className="form-input" name="phone" inputMode="numeric" placeholder="Telefone" required />
          <input className="form-input uppercase" name="adminCode" inputMode="text" pattern="[A-Za-z][0-9]{3}" placeholder="Codigo do ADM. Ex: A001" defaultValue={adminCode} required />
          <input className="form-input" name="password" type="password" placeholder="Senha" required />
          <input className="form-input" name="confirmPassword" type="password" placeholder="Confirmar senha" required />
          <label className="flex gap-3 text-sm text-zinc-300">
            <input name="termsAccepted" type="checkbox" required /> Aceito os Termos de Uso.
          </label>
          <label className="flex gap-3 text-sm text-zinc-300">
            <input name="privacyAccepted" type="checkbox" required /> Aceito a Politica de Privacidade.
          </label>
          <button className="btn-primary w-full" type="submit">
            Criar conta
          </button>
        </form>
      </AuthCard>
    </>
  );
}
