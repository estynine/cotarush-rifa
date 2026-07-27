import { AdminDashboard } from "@/components/admin/admin";
import { demoAwards, demoCampaigns, demoInstantPrizes, demoOrders, demoProfiles } from "@/lib/demo-data";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const campaigns = demoCampaigns.filter((campaign) => campaign.ownerAdminId === admin.ownerAdminId);
  const campaignIds = new Set(campaigns.map((campaign) => campaign.id));

  return (
    <AdminDashboard
      campaigns={campaigns}
      profiles={demoProfiles.filter((profile) => profile.ownerAdminId === admin.ownerAdminId)}
      orders={demoOrders.filter((order) => order.ownerAdminId === admin.ownerAdminId)}
      prizes={demoInstantPrizes.filter((prize) => campaignIds.has(prize.campaignId))}
      awards={demoAwards.filter((award) => campaignIds.has(award.campaignId))}
    />
  );
}
