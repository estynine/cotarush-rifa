import { AdminTitle } from "@/components/admin/admin";
import { AdminDailyExtremesPanel, AdminDailyRankingTable, AdminTopTenTable } from "@/components/admin/rankings";
import { demoCampaignTopTen, demoCampaigns, demoDailyExtremes, demoDailyRanking } from "@/lib/demo-data";

export default function AdminRankingsPage() {
  return (
    <>
      <AdminTitle title="Rankings" description="Ranking diario, Top 10 da campanha e menor/maior numero do dia." />
      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <AdminDailyRankingTable entries={demoDailyRanking} />
        <AdminTopTenTable entries={demoCampaignTopTen} />
        <AdminDailyExtremesPanel campaign={demoCampaigns[0]} extremes={demoDailyExtremes} />
      </div>
    </>
  );
}
