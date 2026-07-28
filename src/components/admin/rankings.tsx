import { Crown, Gift, TrendingUp } from "lucide-react";
import type { Campaign, DailyExtremes, RankingEntry } from "@/lib/types";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

export function AdminDailyRankingTable({ entries }: Readonly<{ entries: RankingEntry[] }>) {
  return <AdminRankingTable title="Ranking diario" icon={<TrendingUp size={18} />} entries={entries.slice(0, 6)} />;
}

export function AdminTopTenTable({ entries }: Readonly<{ entries: RankingEntry[] }>) {
  return <AdminRankingTable title="Top 10 da campanha" icon={<Crown size={18} />} entries={entries.slice(0, 10)} />;
}

function AdminRankingTable({
  title,
  icon,
  entries,
}: Readonly<{ title: string; icon: React.ReactNode; entries: RankingEntry[] }>) {
  return (
    <section className="panel p-4">
      <h2 className="flex items-center gap-2 text-base font-black text-white">
        <span className="text-cyan-200">{icon}</span>
        {title}
      </h2>
      <div className="mt-4 grid gap-2">
        {entries.length === 0 ? (
          <p className="empty-state">Sem dados ainda.</p>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.participantId} className="grid grid-cols-[2.35rem_1fr_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <span className={index < 3 ? "rank-badge rank-gold" : "rank-badge"}>{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{entry.publicName}</p>
                <p className="text-xs text-zinc-500">Dif. {entry.diffToPrevious.toLocaleString("pt-BR")}</p>
              </div>
              <p className="font-mono text-sm font-black text-cyan-200">{entry.quantity.toLocaleString("pt-BR")}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function AdminDailyExtremesPanel({
  extremes,
  campaign,
}: Readonly<{ extremes: DailyExtremes; campaign: Campaign }>) {
  return (
    <section className="panel p-4">
      <h2 className="flex items-center gap-2 text-base font-black text-white">
        <Gift size={18} className="text-cyan-200" />
        Menor e maior do dia
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ExtremeAdminCard
          label="Menor cota"
          number={extremes.lowestNumber}
          owner={extremes.lowestOwner}
          prize={formatCurrency(campaign.dailyPrize.lowestValueCents)}
        />
        <ExtremeAdminCard
          label="Maior cota"
          number={extremes.highestNumber}
          owner={extremes.highestOwner}
          prize={formatCurrency(campaign.dailyPrize.highestValueCents)}
        />
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Atualizacao: {extremes.updatedAt ? formatDateTime(extremes.updatedAt) : "aguardando cotas"}
      </p>
    </section>
  );
}

function ExtremeAdminCard({
  label,
  number,
  owner,
  prize,
}: Readonly<{ label: string; number?: number; owner?: string; prize: string }>) {
  return (
    <div className="min-w-0 rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-3">
      <p className="text-[0.68rem] font-black uppercase text-amber-200">{label}</p>
      <p className="mt-2 truncate font-mono text-xl font-black text-white">
        {number === undefined ? "---.---" : formatNumber(number)}
      </p>
      <p className="mt-1 truncate text-xs text-zinc-300">{owner ?? "Sem participante"}</p>
      <p className="mt-2 text-xs font-black text-amber-100">{prize}</p>
    </div>
  );
}
