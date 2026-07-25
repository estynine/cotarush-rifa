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
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-black text-white">
        <span className="text-cyan-200">{icon}</span>
        {title}
      </h2>
      <div className="table-wrap mt-4">
        <table className="data-table">
          <thead>
            <tr>
              <th>Posicao</th>
              <th>Participante</th>
              <th>Cotas</th>
              <th>Diferenca</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.participantId}>
                <td>{index + 1}</td>
                <td>{entry.publicName}</td>
                <td>{entry.quantity.toLocaleString("pt-BR")}</td>
                <td>{entry.diffToPrevious.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminDailyExtremesPanel({
  extremes,
  campaign,
}: Readonly<{ extremes: DailyExtremes; campaign: Campaign }>) {
  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-black text-white">
        <Gift size={18} className="text-cyan-200" />
        Menor e maior do dia
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Menor atual</p>
          <p className="mt-2 font-mono text-2xl font-black text-white">
            {extremes.lowestNumber === undefined ? "---.---" : formatNumber(extremes.lowestNumber)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">{extremes.lowestOwner ?? "Sem participante"}</p>
          <p className="mt-2 text-sm font-black text-amber-100">{formatCurrency(campaign.dailyPrize.lowestValueCents)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Maior atual</p>
          <p className="mt-2 font-mono text-2xl font-black text-white">
            {extremes.highestNumber === undefined ? "---.---" : formatNumber(extremes.highestNumber)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">{extremes.highestOwner ?? "Sem participante"}</p>
          <p className="mt-2 text-sm font-black text-amber-100">{formatCurrency(campaign.dailyPrize.highestValueCents)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Atualizacao: {extremes.updatedAt ? formatDateTime(extremes.updatedAt) : "aguardando cotas"}
      </p>
    </section>
  );
}
