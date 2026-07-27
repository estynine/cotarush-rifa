import { demoProfiles } from "@/lib/demo-data";
import { requireUser } from "@/lib/auth";

export default async function AccountProfilePage() {
  const user = await requireUser();
  const profile = demoProfiles.find((item) => item.id === user.id) ?? demoProfiles[0];

  return (
    <section className="px-3 py-6 sm:px-4">
      <h1 className="text-3xl font-black text-white">Perfil</h1>
      <p className="mt-2 text-sm text-zinc-400">Dados cadastrados na sua conta.</p>
      <div className="panel mt-6 grid gap-3 p-5 text-sm text-zinc-300">
        <p><strong className="text-white">Nome completo:</strong> {profile.fullName}</p>
        <p><strong className="text-white">Nome publico:</strong> {profile.publicName}</p>
        <p><strong className="text-white">E-mail:</strong> {profile.email}</p>
        <p><strong className="text-white">Telefone:</strong> {profile.phone}</p>
        <p><strong className="text-white">Codigo do ADM:</strong> {profile.inviteCode ?? "A001"}</p>
      </div>
    </section>
  );
}
