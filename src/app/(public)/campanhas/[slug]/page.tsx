import { notFound } from "next/navigation";
import {
  CampaignHero,
  CampaignProgress,
  CampaignPurchasePanel,
  CampaignTopTen,
  DailyBuyerRanking,
  DailyNumberExtremes,
  FoundPrizes,
} from "@/components/public/campaign";
import {
  demoCampaignTopTen,
  demoDailyExtremes,
  demoDailyRanking,
  demoInstantPrizes,
  findCampaignBySlug,
} from "@/lib/demo-data";

export default async function CampaignDetailPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const campaign = findCampaignBySlug(slug);
  if (!campaign) notFound();

  return (
    <>
      <CampaignHero campaign={campaign} />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="grid gap-6">
          <section className="panel p-5">
            <h2 className="text-xl font-black text-white">Detalhes da campanha</h2>
            <p className="mt-3 leading-7 text-zinc-300">{campaign.fullDescription}</p>
            <CampaignProgress campaign={campaign} />
          </section>
          <div className="grid gap-6 xl:grid-cols-2">
            <DailyBuyerRanking entries={demoDailyRanking} />
            <CampaignTopTen entries={demoCampaignTopTen} />
          </div>
          <DailyNumberExtremes campaign={campaign} extremes={demoDailyExtremes} />
          <FoundPrizes prizes={demoInstantPrizes} />
        </div>
        <CampaignPurchasePanel campaign={campaign} />
      </section>
    </>
  );
}
