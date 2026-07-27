import Link from "next/link";
import { CalendarClock, Crown, Gift, TrendingUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Campaign, DailyExtremes, InstantPrize, RankingEntry } from "@/lib/types";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { QuantitySelector } from "./quantity-selector";

export function CampaignCard({ campaign }: Readonly<{ campaign: Campaign }>) {
  return (
    <article className="card group overflow-hidden">
      <div className="relative min-h-48 overflow-hidden rounded-t-lg bg-[#111827]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.28),rgba(124,58,237,0.22)),radial-gradient(circle_at_70%_30%,rgba(250,204,21,0.18),transparent_26%)]" />
        <div className="absolute inset-x-6 bottom-6">
          <div className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
            {campaign.subtitle}
          </div>
          <h2 className="mt-3 text-2xl font-black text-white">{campaign.title}</h2>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm leading-6 text-zinc-400">{campaign.shortDescription}</p>
        <CampaignProgress campaign={campaign} />
        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Cota</p>
            <p className="text-xl font-black text-cyan-200">{formatCurrency(campaign.pricePerNumberCents)}</p>
          </div>
          <Link className="btn-primary" href={`/campanhas/${campaign.slug}`}>
            Ver campanha
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CampaignHero({ campaign }: Readonly<{ campaign: Campaign }>) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
        <div className="self-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
            <Zap size={14} />
            Campanha ativa
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
            {campaign.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">{campaign.fullDescription}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Premio" value={campaign.subtitle} tone="gold" />
            <Metric label="Valor estimado" value={formatCurrency(campaign.estimatedValueCents)} />
            <Metric label="Apuracao" value={formatDateTime(campaign.drawAt)} />
          </div>
        </div>
        <div className="panel relative min-h-[420px] overflow-hidden p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_35%,rgba(34,211,238,0.28),transparent_30%),linear-gradient(145deg,rgba(124,58,237,0.38),rgba(8,13,23,0.92))]" />
          <div className="relative grid h-full place-items-center">
            <div className="setup-visual" aria-label="PC gamer completo">
              <span className="monitor" />
              <span className="tower" />
              <span className="keyboard" />
              <span className="mouse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CampaignMobileHero({ campaign }: Readonly<{ campaign: Campaign }>) {
  return (
    <article className="panel overflow-hidden">
      <div className="relative min-h-[260px] overflow-hidden bg-[#111827]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(20,184,166,0.16)),radial-gradient(circle_at_72%_26%,rgba(250,204,21,0.2),transparent_28%)]" />
        <div className="relative grid min-h-[260px] place-items-center p-5">
          <div className="setup-visual compact" aria-label={campaign.title}>
            <span className="monitor" />
            <span className="tower" />
            <span className="keyboard" />
            <span className="mouse" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase text-cyan-200">
          <Zap size={14} />
          Campanha ativa
        </div>
        <h1 className="mt-3 text-3xl font-black text-white">{campaign.title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{campaign.fullDescription}</p>
        <CampaignProgress campaign={campaign} />
      </div>
    </article>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone?: "gold" }>) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={tone === "gold" ? "mt-2 font-black text-amber-200" : "mt-2 font-black text-white"}>{value}</p>
    </div>
  );
}

export function CampaignProgress({ campaign }: Readonly<{ campaign: Campaign }>) {
  const progress = Math.min(100, (campaign.confirmedNumbers / campaign.totalNumbers) * 100);
  const remaining = campaign.totalNumbers - campaign.confirmedNumbers;

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-zinc-400">
        <span>{campaign.confirmedNumbers.toLocaleString("pt-BR")} distribuidas</span>
        <span>{formatPercent(progress)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{remaining.toLocaleString("pt-BR")} cotas restantes</p>
    </div>
  );
}

export function CampaignPurchasePanel({ campaign }: Readonly<{ campaign: Campaign }>) {
  return (
    <aside className="panel p-4 lg:sticky lg:top-24">
      <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] p-4">
        <p className="text-xs font-black uppercase text-cyan-200">Valor da cota</p>
        <p className="mt-1 text-3xl font-black text-white">{formatCurrency(campaign.pricePerNumberCents)}</p>
      </div>
      <h2 className="mt-4 text-lg font-black text-white">Escolha suas cotas</h2>
      <QuantitySelector campaign={campaign} />
    </aside>
  );
}

export function DailyBuyerRanking({ entries }: Readonly<{ entries: RankingEntry[] }>) {
  return (
    <section className="panel p-5">
      <SectionTitle icon={TrendingUp} title="Ranking diario" />
      <div className="mt-4 grid gap-2">
        {entries.slice(0, 6).map((entry, index) => (
          <RankingRow key={entry.participantId} index={index} entry={entry} />
        ))}
      </div>
    </section>
  );
}

export function CampaignTopTen({ entries }: Readonly<{ entries: RankingEntry[] }>) {
  return (
    <section className="panel p-5">
      <SectionTitle icon={Crown} title="Top 10 da campanha" />
      <div className="mt-4 grid gap-2">
        {entries.slice(0, 10).map((entry, index) => (
          <RankingRow key={entry.participantId} index={index} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function RankingRow({ index, entry }: Readonly<{ index: number; entry: RankingEntry }>) {
  return (
    <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <span className={index < 3 ? "rank-badge rank-gold" : "rank-badge"}>{index + 1}</span>
      <div>
        <p className="font-bold text-white">{entry.publicName}</p>
        <p className="text-xs text-zinc-500">Dif.: {entry.diffToPrevious.toLocaleString("pt-BR")}</p>
      </div>
      <p className="font-mono font-black text-cyan-200">{entry.quantity.toLocaleString("pt-BR")}</p>
    </div>
  );
}

export function DailyNumberExtremes({
  extremes,
  campaign,
  compact = false,
}: Readonly<{ extremes: DailyExtremes; campaign: Campaign; compact?: boolean }>) {
  return (
    <section className={compact ? "panel p-3" : "panel p-5"}>
      <SectionTitle icon={Gift} title="Menor e maior do dia" />
      <div className={compact ? "mt-3 grid grid-cols-2 gap-2" : "mt-4 grid gap-3 sm:grid-cols-2"}>
        <ExtremeCard
          label="Menor numero achado do dia"
          number={extremes.lowestNumber}
          owner={extremes.lowestOwner}
          prize={formatCurrency(campaign.dailyPrize.lowestValueCents)}
          compact={compact}
        />
        <ExtremeCard
          label="Maior numero achado do dia"
          number={extremes.highestNumber}
          owner={extremes.highestOwner}
          prize={formatCurrency(campaign.dailyPrize.highestValueCents)}
          compact={compact}
        />
      </div>
      <p className={compact ? "mt-3 flex items-center gap-2 text-[0.7rem] text-zinc-500" : "mt-4 flex items-center gap-2 text-xs text-zinc-500"}>
        <CalendarClock size={14} />
        Ultima atualizacao: {extremes.updatedAt ? formatDateTime(extremes.updatedAt) : "aguardando primeiras cotas"}
      </p>
    </section>
  );
}

function ExtremeCard({
  label,
  number,
  owner,
  prize,
  compact = false,
}: Readonly<{ label: string; number?: number; owner?: string; prize: string; compact?: boolean }>) {
  return (
    <div className="rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-3">
      <p className={compact ? "text-[0.66rem] font-bold uppercase text-amber-200" : "text-xs font-bold uppercase tracking-[0.18em] text-amber-200"}>
        {label}
      </p>
      <p className={compact ? "mt-2 font-mono text-xl font-black text-white" : "mt-3 font-mono text-3xl font-black text-white"}>
        {number === undefined ? "---.---" : formatNumber(number)}
      </p>
      <p className={compact ? "mt-1 truncate text-xs text-zinc-300" : "mt-1 text-sm text-zinc-300"}>{owner ?? "Aguardando participante"}</p>
      <p className={compact ? "mt-2 text-xs font-black text-amber-100" : "mt-3 text-sm font-black text-amber-100"}>Premio: {prize}</p>
    </div>
  );
}

export function FoundPrizes({ prizes }: Readonly<{ prizes: InstantPrize[] }>) {
  const found = prizes.filter((prize) => prize.found);

  return (
    <section className="panel p-5">
      <SectionTitle icon={Gift} title="Cotas premiadas encontradas" />
      <p className="mt-2 text-sm text-zinc-400">
        Esta campanha pode disponibilizar numeros premiados durante periodos promocionais.
      </p>
      <div className="mt-4 grid gap-3">
        {found.length === 0 ? (
          <p className="empty-state">Nenhum numero premiado encontrado ainda.</p>
        ) : (
          found.map((prize) => (
            <div key={prize.id} className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
              <p className="font-mono text-xl font-black text-emerald-200">{formatNumber(prize.number)}</p>
              <p className="mt-1 font-bold text-white">{prize.title}</p>
              <p className="text-sm text-zinc-400">{prize.description}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SectionTitle({ icon: Icon, title }: Readonly<{ icon: LucideIcon; title: string }>) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-black text-white">
      <Icon size={19} className="text-cyan-200" />
      {title}
    </h2>
  );
}
