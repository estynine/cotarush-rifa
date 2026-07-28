import { notFound } from "next/navigation";
import {
  CampaignMobileHero,
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
  const campaignPrizes = demoInstantPrizes.filter((prize) => prize.campaignId === campaign.id);

  return (
    <>
      <section className="mx-auto grid max-w-xl gap-4 px-3 py-4 sm:px-4">
        <DailyNumberExtremes campaign={campaign} extremes={demoDailyExtremes} compact />
        <CampaignMobileHero campaign={campaign} />
        <CampaignPurchasePanel campaign={campaign} />
        <FoundPrizes prizes={campaignPrizes} />
        <div className="grid gap-4">
          <DailyBuyerRanking entries={demoDailyRanking} />
          <CampaignTopTen entries={demoCampaignTopTen} />
        </div>
      </section>
    </>
  );
}
