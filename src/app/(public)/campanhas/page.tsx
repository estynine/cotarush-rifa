import Link from "next/link";
import { CampaignCard } from "@/components/public/campaign";
import { demoAdminTenants, demoCampaigns } from "@/lib/demo-data";

export default async function CampaignsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ admin?: string }> }>) {
  const { admin = "" } = await searchParams;
  const tenant = demoAdminTenants.find((item) => item.inviteCode === admin.toUpperCase());
  const campaigns = tenant ? demoCampaigns.filter((campaign) => campaign.ownerAdminId === tenant.id) : [];

  return (
    <>
      <section className="mx-auto max-w-xl px-3 py-6 sm:px-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Campanhas ativas</p>
        <h1 className="mt-2 text-4xl font-black text-white">{tenant ? `Campanhas de ${tenant.publicName}` : "Use o codigo do ADM"}</h1>
        <div className="mt-6 grid gap-5">
          {!tenant ? (
            <div className="panel p-5">
              <p className="text-sm leading-6 text-zinc-300">Para participar, entre pelo link do ADM ou crie sua conta com o codigo dele.</p>
              <Link className="btn-primary mt-4 w-full" href="/cadastro">
                Criar conta
              </Link>
            </div>
          ) : campaigns.length === 0 ? (
            <p className="empty-state">Este ADM ainda nao possui campanhas ativas.</p>
          ) : (
            campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
          )}
        </div>
      </section>
    </>
  );
}
