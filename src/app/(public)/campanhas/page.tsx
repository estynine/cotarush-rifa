import { CampaignCard } from "@/components/public/campaign";
import { demoCampaigns } from "@/lib/demo-data";

export default function CampaignsPage() {
  return (
    <>
      <section className="mx-auto max-w-xl px-3 py-6 sm:px-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Campanhas ativas</p>
        <h1 className="mt-2 text-4xl font-black text-white">Escolha uma campanha premiada</h1>
        <div className="mt-6 grid gap-5">
          {demoCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>
    </>
  );
}
