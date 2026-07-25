import { AuthCard } from "../login/page";

export default function CadastroPage() {
  return (
    <>
      <AuthCard title="Cadastro" subtitle="Crie sua conta com confirmacao de e-mail e aceite dos documentos.">
        <form className="grid gap-3" action="/api/auth/pending-purchase" method="post">
          <input className="form-input" name="fullName" placeholder="Nome completo" required />
          <input className="form-input" name="publicName" placeholder="Nome publico ou apelido" required />
          <input className="form-input" name="email" type="email" placeholder="E-mail" required />
          <input className="form-input" name="phone" inputMode="numeric" placeholder="Telefone" required />
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
