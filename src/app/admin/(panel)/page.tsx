import { AdminDashboard } from "@/components/admin/admin";
import { demoAwards, demoCampaigns, demoInstantPrizes, demoOrders, demoProfiles } from "@/lib/demo-data";

export default function AdminPage() {
  return (
    <AdminDashboard
      campaigns={demoCampaigns}
      profiles={demoProfiles}
      orders={demoOrders}
      prizes={demoInstantPrizes}
      awards={demoAwards}
    />
  );
}
