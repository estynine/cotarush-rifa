import { AdminDashboard, AdminShell } from "@/components/admin";
import { demoAwards, demoCampaigns, demoInstantPrizes, demoOrders, demoProfiles } from "@/lib/demo-data";

export default function AdminPage() {
  return (
    <AdminShell>
      <AdminDashboard
        campaigns={demoCampaigns}
        profiles={demoProfiles}
        orders={demoOrders}
        prizes={demoInstantPrizes}
        awards={demoAwards}
      />
    </AdminShell>
  );
}
