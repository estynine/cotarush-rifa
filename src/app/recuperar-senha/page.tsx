import { PublicShell } from "@/components/shell";
import { demoSocialLinks } from "@/lib/demo-data";
import { AuthCard } from "../login/page";

export default function RecoverPasswordPage() {
  return (
    <PublicShell socialLinks={demoSocialLinks}>
      <AuthCard title="Recuperar senha" subtitle="Informe seu e-mail para receber o link seguro de redefinicao.">
        <form className="grid gap-3" action="/api/auth/pending-purchase" method="post">
          <input className="form-input" name="email" type="email" placeholder="E-mail" required />
          <button className="btn-primary w-full" type="submit">
            Enviar link
          </button>
        </form>
      </AuthCard>
    </PublicShell>
  );
}
