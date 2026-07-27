import { Trophy } from "lucide-react";
import { demoAwards, demoCampaigns, demoProfiles } from "@/lib/demo-data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export default function WinnersPage() {
  return (
    <>
      <section className="mx-auto max-w-xl px-3 py-6 sm:px-4">
        <h1 className="text-3xl font-black text-white">Ganhadores anteriores</h1>
        <div className="mt-6 grid gap-4">
          {demoAwards.map((award) => {
            const profile = demoProfiles.find((item) => item.id === award.participantId);
            const campaign = demoCampaigns.find((item) => item.id === award.campaignId);
            return (
              <article key={award.id} className="panel p-5">
                <Trophy className="text-amber-200" />
                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-amber-200">{award.category}</p>
                <h2 className="mt-2 text-xl font-black text-white">{profile?.publicName}</h2>
                <p className="mt-1 text-sm text-zinc-400">{campaign?.title}</p>
                {award.number !== undefined ? <p className="mt-4 font-mono text-3xl font-black text-emerald-200">{formatNumber(award.number)}</p> : null}
                <p className="mt-3 text-sm text-zinc-300">{award.description}</p>
                {award.valueCents ? <p className="mt-2 font-black text-amber-100">{formatCurrency(award.valueCents)}</p> : null}
                <p className="mt-3 text-xs text-zinc-500">{formatDate(award.createdAt)} - {award.status}</p>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
