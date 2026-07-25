import { MyNumbersGrid } from "@/components/account";
import { PublicShell } from "@/components/shell";
import { demoAllocations, demoSocialLinks } from "@/lib/demo-data";

export default function AccountNumbersPage() {
  return (
    <PublicShell socialLinks={demoSocialLinks}>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-white">Meus numeros</h1>
        <div className="mt-6">
          <MyNumbersGrid allocations={demoAllocations} />
        </div>
      </section>
    </PublicShell>
  );
}
