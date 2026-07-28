import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignCard } from "@/components/public/campaign";
import { demoAdminTenants, demoCampaigns } from "@/lib/demo-data";

export default async function AdminPublicLinkPage({
  params,
}: Readonly<{ params: Promise<{ adminCode: string }> }>) {
  const { adminCode } = await params;
  const code = adminCode.toUpperCase();
  const tenant = demoAdminTenants.find((admin) => admin.inviteCode === code);
  if (!tenant) notFound();

  const campaigns = demoCampaigns.filter((campaign) => campaign.ownerAdminId === tenant.id);

  return (
    <section className="mx-auto max-w-xl px-3 py-6 sm:px-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">ADM {tenant.inviteCode}</p>
      <h1 className="mt-2 text-4xl font-black text-white">Campanhas de {tenant.publicName}</h1>
      <div className="mt-5">
        <Link className="btn-primary w-full" href={`/cadastro?admin=${tenant.inviteCode}`}>
          Criar conta com este ADM
        </Link>
      </div>
      <div className="mt-6 grid gap-5">
        {campaigns.length === 0 ? (
          <p className="empty-state">Este ADM ainda nao possui campanhas ativas.</p>
        ) : (
          campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} href={`/adm/${tenant.inviteCode}/${campaign.slug}`} />
          ))
        )}
      </div>
    </section>
  );
}
