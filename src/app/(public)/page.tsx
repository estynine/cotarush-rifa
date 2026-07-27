import {
  CampaignMobileHero,
  CampaignPurchasePanel,
  CampaignTopTen,
  DailyBuyerRanking,
  DailyNumberExtremes,
  FoundPrizes,
} from "@/components/public/campaign";
import {
  demoCampaigns,
  demoCampaignTopTen,
  demoDailyExtremes,
  demoDailyRanking,
  demoInstantPrizes,
} from "@/lib/demo-data";

export default function Home() {
  const campaign = demoCampaigns[0];

  return (
    <section className="mx-auto grid max-w-xl gap-4 px-3 py-4 sm:px-4">
      <DailyNumberExtremes campaign={campaign} extremes={demoDailyExtremes} compact />
      <CampaignMobileHero campaign={campaign} />
      <CampaignPurchasePanel campaign={campaign} />
      <FoundPrizes prizes={demoInstantPrizes} />
      <section className="grid gap-4">
        <DailyBuyerRanking entries={demoDailyRanking} />
        <CampaignTopTen entries={demoCampaignTopTen} />
      </section>
    </section>
  );
}
