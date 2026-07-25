import { AwardsList } from "@/components/account";
import { PublicShell } from "@/components/shell";
import { demoAwards, demoSocialLinks } from "@/lib/demo-data";

export default function AccountAwardsPage() {
  return (
    <PublicShell socialLinks={demoSocialLinks}>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-white">Minhas premiacoes</h1>
        <div className="mt-6">
          <AwardsList awards={demoAwards} />
        </div>
      </section>
    </PublicShell>
  );
}
