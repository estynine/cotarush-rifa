import { MyNumbersGrid } from "@/components/account/account";
import { demoAllocations } from "@/lib/demo-data";
import { requireUser } from "@/lib/auth";

export default async function AccountNumbersPage() {
  const user = await requireUser();
  const allocations = demoAllocations.filter((allocation) => allocation.participantId === user.id);

  return (
    <>
      <section className="px-3 py-6 sm:px-4">
        <h1 className="text-3xl font-black text-white">Meus numeros</h1>
        <div className="mt-6">
          <MyNumbersGrid allocations={allocations} />
        </div>
      </section>
    </>
  );
}
