"use client";

import { Plus, Pencil, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Campaign, InstantPrize, InstantPrizeReleaseRule, PrizeType } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";

type PrizeDraft = {
  campaignId: string;
  number: string;
  title: string;
  description: string;
  prizeType: PrizeType;
  valueCents: string;
  extraNumbers: string;
  active: boolean;
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

type CreatePayload = {
  campaignId: string;
  number: number;
  title: string;
  description: string;
  prizeType: PrizeType;
  valueCents?: number | null;
  extraNumbers?: number | null;
  active: boolean;
  payoutReserveCents: number;
  releaseRule: InstantPrizeReleaseRule;
  releaseThresholdPercent?: number | null;
  releaseThresholdCents?: number | null;
  publicRuleLabel: string;
  reason: string;
};

const releaseRules: { value: InstantPrizeReleaseRule; label: string; hint: string }[] = [
  { value: "manual", label: "Manual", hint: "So libera quando o ADM ativar." },
  { value: "after_percent_sold", label: "Percentual vendido", hint: "Ex.: 40 ou 99.9 das cotas vendidas." },
  { value: "after_revenue", label: "Caixa minimo", hint: "So libera depois do caixa definido." },
  { value: "sold_out", label: "Cotas esgotadas", hint: "So libera quando a campanha esgotar." },
];

export function InstantPrizeControlPanel({
  campaigns,
  prizes: initialPrizes,
}: Readonly<{ campaigns: Campaign[]; prizes: InstantPrize[] }>) {
  const [prizes, setPrizes] = useState(initialPrizes);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(initialPrizes.map((prize) => [prize.id, toDraft(prize)])));
  const [createDraft, setCreateDraft] = useState(() => emptyDraft(campaigns[0]?.id ?? ""));
  const [createOpen, setCreateOpen] = useState(initialPrizes.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const found = useMemo(() => prizes.filter((prize) => prize.found), [prizes]);
  const active = useMemo(() => prizes.filter((prize) => prize.active && !prize.found), [prizes]);
  const activeExposureCents = active.reduce((sum, prize) => sum + (prize.valueCents ?? 0), 0);

  async function createPrize() {
    try {
      const payload = buildCreatePayload(createDraft);
      setBusyKey("create");
      setMessage(null);

      const response = await fetch("/api/admin/instant-prizes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string; result?: InstantPrize };

      if (!response.ok || !body.result) throw new Error(body.error ?? "Nao foi possivel adicionar.");

      setPrizes((current) => [body.result as InstantPrize, ...current]);
      setDrafts((current) => ({ ...current, [body.result!.id]: toDraft(body.result!) }));
      setCreateDraft(emptyDraft(payload.campaignId));
      setCreateOpen(false);
      setEditingId(body.result.id);
      setMessage("Numero premiado adicionado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dados invalidos.");
    } finally {
      setBusyKey(null);
    }
  }

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
      setEditingId(null);
      setMessage("Controle salvo com auditoria.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    } finally {
      setBusyKey(null);
    }
  }

  function submitControls(prize: InstantPrize, draft: PrizeDraft, busy: string) {
    try {
      void patchControls(
        {
          prizeId: prize.id,
          active: draft.active,
          valueCents: parseOptionalCents(draft.valueCents),
          payoutReserveCents: parseRequiredCents(draft.payoutReserveCents),
          releaseRule: draft.releaseRule,
          releaseThresholdPercent: draft.releaseRule === "after_percent_sold" ? parseRequiredNumber(draft.releaseThresholdPercent) : null,
          releaseThresholdCents: draft.releaseRule === "after_revenue" ? parseRequiredCents(draft.releaseThresholdCents) : null,
          publicRuleLabel: draft.publicRuleLabel,
          reason: draft.reason,
        },
        busy,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dados invalidos.");
    }
  }

  function updateDraft(prizeId: string, patch: Partial<PrizeDraft>) {
    setDrafts((current) => ({ ...current, [prizeId]: { ...current[prizeId], ...patch } }));
  }

  function updateCreateDraft(patch: Partial<PrizeDraft>) {
    setCreateDraft((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PrizeMetric label="Numeros cadastrados" value={prizes.length.toString()} />
        <PrizeMetric label="Ativos para encontrar" value={active.length.toString()} />
        <PrizeMetric label="Encontrados" value={found.length.toString()} tone="success" />
        <PrizeMetric label="Exposicao ativa" value={formatCurrency(activeExposureCents)} tone="gold" />
      </div>

      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Numeros premiados</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">Cadastre manualmente cada numero, valor e regra de liberacao.</p>
          </div>
          <button className="btn-primary" type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Adicionar numero premiado
          </button>
        </div>

        {message ? <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-cyan-100">{message}</p> : null}

        {createOpen ? (
          <PrizeEditor
            title="Adicionar numero premiado"
            campaigns={campaigns}
            draft={createDraft}
            onChange={updateCreateDraft}
            onCancel={() => setCreateOpen(false)}
            onSubmit={createPrize}
            submitLabel="Enviar"
            busy={busyKey === "create"}
          />
        ) : null}

        {prizes.length === 0 ? (
          <div className="empty-state mt-5">
            Nenhum numero premiado cadastrado ainda. Use o botao de adicionar para escolher os numeros da campanha.
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {prizes.map((prize) => {
              const draft = drafts[prize.id] ?? toDraft(prize);
              const isEditing = editingId === prize.id;

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
                    <p>Exposicao ativa: <strong className="text-white">{prize.active && !prize.found ? formatCurrency(prize.valueCents ?? 0) : formatCurrency(0)}</strong></p>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button className="btn-secondary" disabled={prize.found} type="button" onClick={() => setEditingId(isEditing ? null : prize.id)}>
                      {isEditing ? <X size={17} /> : <Pencil size={17} />}
                      {isEditing ? "Fechar edicao" : "Editar"}
                    </button>
                    <button className="btn-secondary" disabled={prize.found || busyKey === `${prize.id}-active`} type="button" onClick={() => patchControls({ prizeId: prize.id, active: !prize.active, reason: draft.reason }, `${prize.id}-active`)}>
                      {prize.active ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                  {isEditing ? (
                    <PrizeEditor
                      title={`Editar ${formatNumber(prize.number)}`}
                      draft={draft}
                      onChange={(patch) => updateDraft(prize.id, patch)}
                      onCancel={() => setEditingId(null)}
                      onSubmit={() => submitControls(prize, draft, `${prize.id}-save`)}
                      submitLabel="Salvar alteracoes"
                      busy={busyKey === `${prize.id}-save`}
                      lockedNumber
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PrizeEditor({
  title,
  campaigns = [],
  draft,
  lockedNumber = false,
  busy,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
}: Readonly<{
  title: string;
  campaigns?: Campaign[];
  draft: PrizeDraft;
  lockedNumber?: boolean;
  busy: boolean;
  submitLabel: string;
  onChange: (patch: Partial<PrizeDraft>) => void;
  onCancel: () => void;
  onSubmit: () => void;
}>) {
  const rule = releaseRules.find((item) => item.value === draft.releaseRule);

  return (
    <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black text-white">{title}</h3>
        <button className="icon-button" type="button" aria-label="Fechar painel" onClick={onCancel}>
          <X size={18} />
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {campaigns.length > 0 ? (
          <label className="grid gap-2 text-sm font-bold text-zinc-300">
            Campanha
            <select className="form-input" value={draft.campaignId} onChange={(event) => onChange({ campaignId: event.target.value })}>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Numero
          <input className="form-input" disabled={lockedNumber} inputMode="numeric" value={draft.number} onChange={(event) => onChange({ number: event.target.value })} placeholder="000000" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Nome do premio
          <input className="form-input" value={draft.title} onChange={(event) => onChange({ title: event.target.value })} placeholder="Premio em dinheiro" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Tipo
          <select className="form-input" value={draft.prizeType} onChange={(event) => onChange({ prizeType: event.target.value as PrizeType })}>
            <option value="money">Dinheiro</option>
            <option value="product">Produto</option>
            <option value="extra_numbers">Cotas extras</option>
            <option value="credit">Credito</option>
            <option value="other">Outro</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Valor do premio em centavos
          <input className="form-input" inputMode="numeric" value={draft.valueCents} onChange={(event) => onChange({ valueCents: event.target.value })} placeholder="5000" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Cotas extras
          <input className="form-input" inputMode="numeric" value={draft.extraNumbers} onChange={(event) => onChange({ extraNumbers: event.target.value })} placeholder="0" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Regra de liberacao
          <select className="form-input" value={draft.releaseRule} onChange={(event) => onChange({ releaseRule: event.target.value as InstantPrizeReleaseRule })}>
            {releaseRules.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Percentual vendido
          <input className="form-input" inputMode="decimal" value={draft.releaseThresholdPercent} onChange={(event) => onChange({ releaseThresholdPercent: event.target.value })} placeholder="99.9" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Caixa minimo em centavos
          <input className="form-input" inputMode="numeric" value={draft.releaseThresholdCents} onChange={(event) => onChange({ releaseThresholdCents: event.target.value })} placeholder="250000" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300">
          Reserva minima em centavos
          <input className="form-input" inputMode="numeric" value={draft.payoutReserveCents} onChange={(event) => onChange({ payoutReserveCents: event.target.value })} placeholder="5000" />
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm font-bold text-zinc-300">
          <input type="checkbox" checked={draft.active} onChange={(event) => onChange({ active: event.target.checked })} />
          Ativo para ser encontrado
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300 md:col-span-2">
          Texto da regra publica
          <input className="form-input" value={draft.publicRuleLabel} onChange={(event) => onChange({ publicRuleLabel: event.target.value })} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300 md:col-span-2">
          Descricao
          <input className="form-input" value={draft.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="R$ 50,00" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-300 md:col-span-2">
          Motivo administrativo
          <input className="form-input" value={draft.reason} onChange={(event) => onChange({ reason: event.target.value })} />
        </label>
      </div>
      <p className="mt-3 text-xs text-cyan-100/75">{rule?.hint}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button className="btn-primary" type="button" disabled={busy} onClick={onSubmit}>
          {submitLabel}
        </button>
        <button className="btn-secondary" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
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

function emptyDraft(campaignId: string): PrizeDraft {
  return {
    campaignId,
    number: "",
    title: "",
    description: "",
    prizeType: "money",
    valueCents: "",
    extraNumbers: "",
    active: false,
    payoutReserveCents: "0",
    releaseRule: "manual",
    releaseThresholdPercent: "",
    releaseThresholdCents: "",
    publicRuleLabel: "Liberado pela administracao da campanha",
    reason: "criacao de numero premiado",
  };
}

function toDraft(prize: InstantPrize): PrizeDraft {
  return {
    campaignId: prize.campaignId,
    number: prize.number.toString(),
    title: prize.title,
    description: prize.description,
    prizeType: prize.prizeType,
    valueCents: prize.valueCents == null ? "" : prize.valueCents.toString(),
    extraNumbers: prize.extraNumbers == null ? "" : prize.extraNumbers.toString(),
    active: prize.active,
    payoutReserveCents: prize.payoutReserveCents.toString(),
    releaseRule: prize.releaseRule,
    releaseThresholdPercent: prize.releaseThresholdPercent == null ? "" : prize.releaseThresholdPercent.toString(),
    releaseThresholdCents: prize.releaseThresholdCents == null ? "" : prize.releaseThresholdCents.toString(),
    publicRuleLabel: prize.publicRuleLabel,
    reason: "ajuste administrativo de liberacao",
  };
}

function buildCreatePayload(draft: PrizeDraft): CreatePayload {
  return {
    campaignId: draft.campaignId,
    number: parsePrizeNumber(draft.number),
    title: requiredText(draft.title, "Nome do premio"),
    description: requiredText(draft.description, "Descricao"),
    prizeType: draft.prizeType,
    valueCents: parseOptionalCents(draft.valueCents),
    extraNumbers: parseOptionalPositiveNumber(draft.extraNumbers),
    active: draft.active,
    payoutReserveCents: parseRequiredCents(draft.payoutReserveCents),
    releaseRule: draft.releaseRule,
    releaseThresholdPercent: draft.releaseRule === "after_percent_sold" ? parseRequiredNumber(draft.releaseThresholdPercent) : null,
    releaseThresholdCents: draft.releaseRule === "after_revenue" ? parseRequiredCents(draft.releaseThresholdCents) : null,
    publicRuleLabel: requiredText(draft.publicRuleLabel, "Texto publico"),
    reason: requiredText(draft.reason, "Motivo"),
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

function requiredText(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 3) throw new Error(`${label} invalido.`);
  return trimmed;
}

function parsePrizeNumber(value: string): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || number > 999999) throw new Error("Numero premiado invalido.");
  return number;
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

function parseOptionalPositiveNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "0") return null;
  const number = Number(trimmed);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error("Quantidade de cotas extras invalida.");
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
  if (prize.releaseRule === "sold_out") return "somente com cotas esgotadas";
  return "manual";
}
