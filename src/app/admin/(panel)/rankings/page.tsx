import { AdminTitle } from "@/components/admin/admin";
import { AdminDailyExtremesPanel, AdminDailyRankingTable, AdminTopTenTable } from "@/components/admin/rankings";
import { demoCampaignTopTen, demoCampaigns, demoDailyExtremes, demoDailyRanking } from "@/lib/demo-data";

export default function AdminRankingsPage() {
  return (
    <>
      <AdminTitle title="Rankings" description="Ranking diario, Top 10 da campanha e menor/maior numero do dia." />
      <div className="mt-6 grid gap-4">
        <AdminDailyExtremesPanel campaign={demoCampaigns[0]} extremes={demoDailyExtremes} />
        <AdminDailyRankingTable entries={demoDailyRanking} />
        <AdminTopTenTable entries={demoCampaignTopTen} />
      </div>
    </>
  );
}
