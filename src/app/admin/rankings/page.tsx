import { CampaignTopTen, DailyBuyerRanking, DailyNumberExtremes } from "@/components/campaign";
import { AdminShell, AdminTitle } from "@/components/admin";
import { demoCampaignTopTen, demoCampaigns, demoDailyExtremes, demoDailyRanking } from "@/lib/demo-data";

export default function AdminRankingsPage() {
  return (
    <AdminShell>
      <AdminTitle title="Rankings" description="Ranking diario, Top 10 da campanha e menor/maior numero do dia." />
      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <DailyBuyerRanking entries={demoDailyRanking} />
        <CampaignTopTen entries={demoCampaignTopTen} />
        <DailyNumberExtremes campaign={demoCampaigns[0]} extremes={demoDailyExtremes} />
      </div>
    </AdminShell>
  );
}
