import { AuthCard } from "../login/page";
import { SignupForm } from "@/components/public/signup-form";

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
        <SignupForm defaultAdminCode={adminCode} />
      </AuthCard>
    </>
  );
}
