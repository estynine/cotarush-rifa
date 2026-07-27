import { MyNumbersGrid } from "@/components/account/account";
import { demoAllocations } from "@/lib/demo-data";
import { requireUser } from "@/lib/auth";

export default async function AccountNumbersPage() {
  const user = await requireUser();
  const allocations = demoAllocations.filter((allocation) => allocation.participantId === user.id);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-white">Meus numeros</h1>
        <div className="mt-6">
          <MyNumbersGrid allocations={allocations} />
        </div>
      </section>
    </>
  );
}
