import { CampaignCard } from "@/components/public/campaign";
import { demoCampaigns } from "@/lib/demo-data";

export default function CampaignsPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Campanhas ativas</p>
        <h1 className="mt-2 text-4xl font-black text-white">Escolha uma campanha premiada</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {demoCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>
    </>
  );
}
