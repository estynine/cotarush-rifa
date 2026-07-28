import { AdminTitle } from "@/components/admin/admin";
import { AdminDailyRankingTable, AdminTopTenTable } from "@/components/admin/rankings";
import { demoCampaignTopTen, demoCampaigns, demoDailyExtremes, demoDailyRanking } from "@/lib/demo-data";

export default function AdminRankingsPage() {
  return (
    <>
      <AdminTitle title="Rankings" description="Ranking diario, Top 10 da campanha e menor/maior numero do dia." />
      <div className="mt-6 grid gap-4">
        <AdminDailyRankingTable campaign={demoCampaigns[0]} entries={demoDailyRanking} extremes={demoDailyExtremes} />
        <AdminTopTenTable entries={demoCampaignTopTen} />
      </div>
    </>
  );
}
