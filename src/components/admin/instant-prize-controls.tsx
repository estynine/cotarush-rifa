"use client";

import { useMemo, useState } from "react";
import type { InstantPrize, InstantPrizeReleaseRule } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";

type PrizeDraft = {
  valueCents: string;
  payoutReserveCents: string;
  releaseRule: InstantPrizeReleaseRule;
  releaseThresholdPercent: string;
  releaseThresholdCents: string;
  publicRuleLabel: string;
  reason: string;
};

type PatchPayload = {
  prizeId?: string;
  campaignId?: string;
  active?: boolean;
  valueCents?: number | null;
  payoutReserveCents?: number;
  releaseRule?: InstantPrizeReleaseRule;
  releaseThresholdPercent?: number | null;
  releaseThresholdCents?: number | null;
  publicRuleLabel?: string;
  reason?: string;
};

type RulePayloadInput = {
  prizeId?: string;
  campaignId?: string;
  releaseRule: InstantPrizeReleaseRule;
  releaseThresholdPercent: string;
  releaseThresholdCents: string;
  publicRuleLabel: string;
  payoutReserveCents?: string;
  reason?: string;
};

const releaseRules: { value: InstantPrizeReleaseRule; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "after_percent_sold", label: "Percentual vendido" },
  { value: "after_revenue", label: "Caixa minimo" },
  { value: "sold_out", label: "Apos esgotar cotas" },
];

export function InstantPrizeControlPanel({ prizes: initialPrizes }: Readonly<{ prizes: InstantPrize[] }>) {
  const [prizes, setPrizes] = useState(initialPrizes);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(initialPrizes.map((prize) => [prize.id, toDraft(prize)])));
  const [batch, setBatch] = useState({
    releaseRule: "manual" as InstantPrizeReleaseRule,
    releaseThresholdPercent: "",
    releaseThresholdCents: "",
    payoutReserveCents: "0",
    publicRuleLabel: "Liberado pela administracao da campanha",
    reason: "ajuste administrativo de liberacao",
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const found = useMemo(() => prizes.filter((prize) => prize.found), [prizes]);
  const active = useMemo(() => prizes.filter((prize) => prize.active && !prize.found), [prizes]);
  const campaignId = prizes[0]?.campaignId;
  const activeExposureCents = active.reduce((sum, prize) => sum + (prize.valueCents ?? 0), 0);
  const reserveCents = prizes.reduce((sum, prize) => sum + prize.payoutReserveCents, 0);

  async function patchControls(payload: PatchPayload, busy: string) {
    setBusyKey(busy);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/instant-prizes", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(body.error ?? "Nao foi possivel salvar.");

      setPrizes((current) => current.map((prize) => applyPayloadToPrize(prize, payload)));
      setDrafts((current) => {
        const next = { ...current };
        for (const prize of prizes.map((item) => applyPayloadToPrize(item, payload))) {
          next[prize.id] = toDraft(prize);
        }
        return next;
      });
      setMessage("Controle salvo com auditoria.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    } finally {
      setBusyKey(null);
    }
  }

  function submitControls(createPayload: () => PatchPayload, busy: string) {
    try {
      void patchControls(createPayload(), busy);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dados invalidos.");
    }
  }

  function updateDraft(prizeId: string, patch: Partial<PrizeDraft>) {
    setDrafts((current) => ({ ...current, [prizeId]: { ...current[prizeId], ...patch } }));
  }

  function updateBatch(patch: Partial<typeof batch>) {
    setBatch((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PrizeMetric label="Ativos para encontrar" value={active.length.toString()} />
        <PrizeMetric label="Encontrados" value={found.length.toString()} tone="success" />
        <PrizeMetric label="Exposicao ativa" value={formatCurrency(activeExposureCents)} tone="gold" />
        <PrizeMetric label="Reserva exigida" value={formatCurrency(reserveCents)} />
      </div>
      <section className="panel p-5">
        <h2 className="text-lg font-black text-white">Controle de liberacao dos premios</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          O ADM controla valor, regra de liberacao e estado de cada cota premiada. Premio encontrado fica bloqueado
          contra reducao de valor, troca de numero, exclusao ou transferencia.
        </p>
        {message ? <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-cyan-100">{message}</p> : null}
        <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
          <div className="grid gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-100">Acoes em lote</p>
              <p className="mt-1 text-sm text-cyan-100/75">Aplique a mesma regra para todos os premios ainda nao encontrados.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <select className="form-input" value={batch.releaseRule} onChange={(event) => updateBatch({ releaseRule: event.target.value as InstantPrizeReleaseRule })} aria-label="Regra global">
                {releaseRules.map((rule) => (
                  <option key={rule.value} value={rule.value}>
                    {rule.label}
                  </option>
                ))}
              </select>
              <input className="form-input" inputMode="numeric" placeholder="Percentual" value={batch.releaseThresholdPercent} onChange={(event) => updateBatch({ releaseThresholdPercent: event.target.value })} />
              <input className="form-input" inputMode="numeric" placeholder="Caixa em centavos" value={batch.releaseThresholdCents} onChange={(event) => updateBatch({ releaseThresholdCents: event.target.value })} />
              <input className="form-input" inputMode="numeric" placeholder="Reserva em centavos" value={batch.payoutReserveCents} onChange={(event) => updateBatch({ payoutReserveCents: event.target.value })} />
            </div>
            <input className="form-input" value={batch.publicRuleLabel} onChange={(event) => updateBatch({ publicRuleLabel: event.target.value })} aria-label="Texto publico da regra global" />
            <input className="form-input" value={batch.reason} onChange={(event) => updateBatch({ reason: event.target.value })} aria-label="Motivo da acao em lote" />
            <div className="grid gap-2 sm:grid-cols-3">
              <button className="btn-secondary" disabled={!campaignId || active.length === 0 || busyKey === "batch-off"} type="button" onClick={() => campaignId && patchControls({ campaignId, active: false, reason: batch.reason }, "batch-off")}>
                Desativar todos
              </button>
              <button className="btn-secondary" disabled={!campaignId || active.length === 0 || busyKey === "batch-rule"} type="button" onClick={() => campaignId && submitControls(() => buildRulePayload({ campaignId, ...batch }), "batch-rule")}>
                Regra global
              </button>
              <button className="btn-secondary" disabled={!campaignId || busyKey === "batch-on"} type="button" onClick={() => campaignId && patchControls({ campaignId, active: true, releaseRule: "manual", releaseThresholdPercent: null, releaseThresholdCents: null, publicRuleLabel: batch.publicRuleLabel, reason: batch.reason }, "batch-on")}>
                Liberar manualmente
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {prizes.map((prize) => {
            const draft = drafts[prize.id] ?? toDraft(prize);
            return (
              <article key={prize.id} className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xl font-black text-cyan-200">{formatNumber(prize.number)}</p>
                    <h3 className="mt-1 font-black text-white">{prize.title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{prize.publicRuleLabel}</p>
                  </div>
                  <span className="status-pill">{prize.found ? "Encontrado e travado" : prize.active ? "Ativo" : "Desativado"}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Valor: <strong className="text-white">{formatCurrency(prize.valueCents ?? 0)}</strong></p>
                  <p>Reserva minima: <strong className="text-white">{formatCurrency(prize.payoutReserveCents)}</strong></p>
                  <p>Regra: <strong className="text-white">{formatReleaseRule(prize)}</strong></p>
                  <p>Auditoria: <strong className="text-white">{prize.found ? "bloqueado" : "alteravel com motivo"}</strong></p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <input className="form-input" disabled={prize.found} inputMode="numeric" value={draft.valueCents} onChange={(event) => updateDraft(prize.id, { valueCents: event.target.value })} aria-label={`Valor em centavos ${formatNumber(prize.number)}`} />
                  <input className="form-input" disabled={prize.found} inputMode="numeric" value={draft.payoutReserveCents} onChange={(event) => updateDraft(prize.id, { payoutReserveCents: event.target.value })} aria-label={`Reserva em centavos ${formatNumber(prize.number)}`} />
                  <select className="form-input" disabled={prize.found} value={draft.releaseRule} onChange={(event) => updateDraft(prize.id, { releaseRule: event.target.value as InstantPrizeReleaseRule })} aria-label={`Regra ${formatNumber(prize.number)}`}>
                    {releaseRules.map((rule) => (
                      <option key={rule.value} value={rule.value}>
                        {rule.label}
                      </option>
                    ))}
                  </select>
                  <input className="form-input" disabled={prize.found} inputMode="numeric" placeholder="Percentual" value={draft.releaseThresholdPercent} onChange={(event) => updateDraft(prize.id, { releaseThresholdPercent: event.target.value })} />
                  <input className="form-input" disabled={prize.found} inputMode="numeric" placeholder="Caixa em centavos" value={draft.releaseThresholdCents} onChange={(event) => updateDraft(prize.id, { releaseThresholdCents: event.target.value })} />
                  <input className="form-input" disabled={prize.found} value={draft.publicRuleLabel} onChange={(event) => updateDraft(prize.id, { publicRuleLabel: event.target.value })} aria-label={`Texto publico ${formatNumber(prize.number)}`} />
                </div>
                <input className="form-input mt-2" disabled={prize.found} value={draft.reason} onChange={(event) => updateDraft(prize.id, { reason: event.target.value })} aria-label={`Motivo ${formatNumber(prize.number)}`} />
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <button className="btn-secondary" disabled={prize.found || busyKey === `${prize.id}-active`} type="button" onClick={() => patchControls({ prizeId: prize.id, active: !prize.active, reason: draft.reason }, `${prize.id}-active`)}>
                    {prize.active ? "Desativar" : "Ativar"}
                  </button>
                  <button className="btn-secondary" disabled={prize.found || busyKey === `${prize.id}-value`} type="button" onClick={() => submitControls(() => ({ prizeId: prize.id, valueCents: parseOptionalCents(draft.valueCents), payoutReserveCents: parseRequiredCents(draft.payoutReserveCents), publicRuleLabel: draft.publicRuleLabel, reason: draft.reason }), `${prize.id}-value`)}>
                    Salvar valor
                  </button>
                  <button className="btn-secondary" disabled={prize.found || busyKey === `${prize.id}-rule`} type="button" onClick={() => submitControls(() => buildRulePayload({ prizeId: prize.id, ...draft }), `${prize.id}-rule`)}>
                    Regra de caixa
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PrizeMetric({ label, value, tone }: Readonly<{ label: string; value: string; tone?: "gold" | "success" }>) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={tone === "gold" ? "mt-2 text-2xl font-black text-amber-200" : tone === "success" ? "mt-2 text-2xl font-black text-emerald-200" : "mt-2 text-2xl font-black text-white"}>
        {value}
      </p>
    </div>
  );
}

function toDraft(prize: InstantPrize): PrizeDraft {
  return {
    valueCents: prize.valueCents == null ? "" : prize.valueCents.toString(),
    payoutReserveCents: prize.payoutReserveCents.toString(),
    releaseRule: prize.releaseRule,
    releaseThresholdPercent: prize.releaseThresholdPercent == null ? "" : prize.releaseThresholdPercent.toString(),
    releaseThresholdCents: prize.releaseThresholdCents == null ? "" : prize.releaseThresholdCents.toString(),
    publicRuleLabel: prize.publicRuleLabel,
    reason: "ajuste administrativo de liberacao",
  };
}

function applyPayloadToPrize(prize: InstantPrize, payload: PatchPayload): InstantPrize {
  if (payload.prizeId && payload.prizeId !== prize.id) return prize;
  if (payload.campaignId && payload.campaignId !== prize.campaignId) return prize;
  if (prize.found) return prize;

  return {
    ...prize,
    active: payload.active ?? prize.active,
    valueCents: payload.valueCents !== undefined ? payload.valueCents ?? undefined : prize.valueCents,
    payoutReserveCents: payload.payoutReserveCents ?? prize.payoutReserveCents,
    releaseRule: payload.releaseRule ?? prize.releaseRule,
    releaseThresholdPercent: payload.releaseThresholdPercent !== undefined ? payload.releaseThresholdPercent ?? undefined : prize.releaseThresholdPercent,
    releaseThresholdCents: payload.releaseThresholdCents !== undefined ? payload.releaseThresholdCents ?? undefined : prize.releaseThresholdCents,
    publicRuleLabel: payload.publicRuleLabel ?? prize.publicRuleLabel,
  };
}

function buildRulePayload(input: RulePayloadInput): PatchPayload {
  return {
    prizeId: input.prizeId,
    campaignId: input.campaignId,
    payoutReserveCents: input.payoutReserveCents == null ? undefined : parseRequiredCents(input.payoutReserveCents),
    releaseRule: input.releaseRule,
    releaseThresholdPercent: input.releaseRule === "after_percent_sold" ? parseRequiredNumber(input.releaseThresholdPercent) : null,
    releaseThresholdCents: input.releaseRule === "after_revenue" ? parseRequiredCents(input.releaseThresholdCents) : null,
    publicRuleLabel: input.publicRuleLabel,
    reason: input.reason,
  };
}

function parseOptionalCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return parseRequiredCents(trimmed);
}

function parseRequiredCents(value: string): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error("Valor em centavos invalido.");
  return number;
}

function parseRequiredNumber(value: string): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) throw new Error("Percentual invalido.");
  return number;
}

function formatReleaseRule(prize: InstantPrize): string {
  if (prize.releaseRule === "after_percent_sold") return `${prize.releaseThresholdPercent ?? 0}% vendido`;
  if (prize.releaseRule === "after_revenue") return `caixa em ${formatCurrency(prize.releaseThresholdCents ?? 0)}`;
  if (prize.releaseRule === "sold_out") return "somente apos esgotar";
  return "manual";
}
