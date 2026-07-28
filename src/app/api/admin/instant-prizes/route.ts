import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { proxyToBackend } from "@/lib/backend-proxy";
import { instantPrizeBatchControlSchema, instantPrizeControlSchema, instantPrizeCreateSchema } from "@/lib/validations";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";
import type { InstantPrize } from "@/lib/types";

type InstantPrizeUpdate = {
  active?: boolean;
  value_cents?: number | null;
  payout_reserve_cents?: number;
  release_rule?: "manual" | "after_percent_sold" | "after_revenue" | "sold_out";
  release_threshold_percent?: number | null;
  release_threshold_cents?: number | null;
  public_rule_label?: string;
  activated_at?: string | null;
  updated_at: string;
};

type InstantPrizeInsert = InstantPrizeUpdate & {
  campaign_id: string;
  number: number;
  title: string;
  prize_type: "money" | "product" | "extra_numbers" | "credit" | "other";
  value_cents?: number | null;
  extra_numbers?: number | null;
  description: string;
  found: false;
  delivery_status: "pending";
};

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const proxied = await proxyToBackend(request, "/admin/instant-prizes");
    if (proxied) return proxied;

    const input = instantPrizeCreateSchema.parse(await request.json());
    const insert = buildInstantPrizeInsert(input);

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ mode: "demo", result: demoPrizeFromInput(input) });
    }

    const supabase = getServiceSupabase();
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, owner_admin_id")
      .eq("id", input.campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
    }

    if (admin.role !== "super_admin" && campaign.owner_admin_id !== admin.ownerAdminId) {
      return NextResponse.json({ error: "Campanha fora do escopo do ADM." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("instant_prizes")
      .insert(insert)
      .select("id, campaign_id, number, title, prize_type, value_cents, extra_numbers, description, image_url, active, found, found_by_participant_id, found_order_id, activated_at, found_at, delivery_status, release_rule, release_threshold_percent, release_threshold_cents, payout_reserve_cents, public_rule_label")
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      admin_id: admin.id,
      action: "instant_prize.create",
      entity: "instant_prizes",
      entity_id: data.id,
      before_data: null,
      after_data: data,
      reason: input.reason,
    });

    return NextResponse.json({ result: mapInstantPrize(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar premio.";
    const status = message === "AUTH_REQUIRED" ? 401 : message === "ADMIN_REQUIRED" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const proxied = await proxyToBackend(request, "/admin/instant-prizes");
    if (proxied) return proxied;

    const body = await request.json();
    if (typeof body === "object" && body !== null && "campaignId" in body) {
      const input = instantPrizeBatchControlSchema.parse(body);
      const updates = buildInstantPrizeUpdates(input);

      if (!hasSupabaseEnv()) {
        return NextResponse.json({ mode: "demo", result: { campaignId: input.campaignId, updates } });
      }

      const supabase = getServiceSupabase();
      const { data: beforeData, error: beforeError } = await supabase
        .from("instant_prizes")
        .select("id, active, value_cents, payout_reserve_cents, release_rule, release_threshold_percent, release_threshold_cents, public_rule_label")
        .eq("campaign_id", input.campaignId)
        .eq("found", false);

      if (beforeError) throw beforeError;

      const { data, error } = await supabase
        .from("instant_prizes")
        .update(updates)
        .eq("campaign_id", input.campaignId)
        .eq("found", false)
        .select("id, active, value_cents, payout_reserve_cents, release_rule, release_threshold_percent, release_threshold_cents, public_rule_label");

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        admin_id: admin.id,
        action: "instant_prize.batch_update",
        entity: "instant_prizes",
        entity_id: input.campaignId,
        before_data: beforeData,
        after_data: data,
        reason: input.reason,
      });

      return NextResponse.json({ result: data ?? [] });
    }

    const input = instantPrizeControlSchema.parse(body);
    const updates = buildInstantPrizeUpdates(input);

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ mode: "demo", result: { prizeId: input.prizeId, updates } });
    }

    const supabase = getServiceSupabase();
    const { data: beforeData, error: beforeError } = await supabase
      .from("instant_prizes")
      .select("id, found, active, value_cents, payout_reserve_cents, release_rule, release_threshold_percent, release_threshold_cents, public_rule_label")
      .eq("id", input.prizeId)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!beforeData) return NextResponse.json({ error: "Premio nao encontrado." }, { status: 404 });
    if (beforeData.found) return NextResponse.json({ error: "Premio encontrado fica travado." }, { status: 409 });

    const { data, error } = await supabase
      .from("instant_prizes")
      .update(updates)
      .eq("id", input.prizeId)
      .eq("found", false)
      .select("id, active, value_cents, payout_reserve_cents, release_rule, release_threshold_percent, release_threshold_cents, public_rule_label")
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      admin_id: admin.id,
      action: "instant_prize.update",
      entity: "instant_prizes",
      entity_id: input.prizeId,
      before_data: beforeData,
      after_data: data,
      reason: input.reason,
    });

    return NextResponse.json({ result: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar premio.";
    const status = message === "AUTH_REQUIRED" ? 401 : message === "ADMIN_REQUIRED" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

function buildInstantPrizeInsert(input: ReturnType<typeof instantPrizeCreateSchema.parse>): InstantPrizeInsert {
  const now = new Date().toISOString();
  return {
    campaign_id: input.campaignId,
    number: input.number,
    title: input.title,
    prize_type: input.prizeType,
    value_cents: input.valueCents,
    extra_numbers: input.extraNumbers,
    description: input.description,
    active: input.active,
    found: false,
    delivery_status: "pending",
    payout_reserve_cents: input.payoutReserveCents,
    public_rule_label: input.publicRuleLabel,
    release_rule: input.releaseRule,
    release_threshold_percent: input.releaseRule === "after_percent_sold" ? input.releaseThresholdPercent ?? null : null,
    release_threshold_cents: input.releaseRule === "after_revenue" ? input.releaseThresholdCents ?? null : null,
    activated_at: input.active ? now : null,
    updated_at: now,
  };
}

function buildInstantPrizeUpdates(input: ReturnType<typeof instantPrizeControlSchema.parse> | ReturnType<typeof instantPrizeBatchControlSchema.parse>): InstantPrizeUpdate {
  const updates: InstantPrizeUpdate = { updated_at: new Date().toISOString() };

  if (input.active !== undefined) {
    updates.active = input.active;
    updates.activated_at = input.active ? new Date().toISOString() : null;
  }

  if (input.valueCents !== undefined) updates.value_cents = input.valueCents;
  if (input.payoutReserveCents !== undefined) updates.payout_reserve_cents = input.payoutReserveCents;
  if (input.publicRuleLabel !== undefined) updates.public_rule_label = input.publicRuleLabel;

  if (input.releaseRule !== undefined) {
    updates.release_rule = input.releaseRule;
    updates.release_threshold_percent = input.releaseThresholdPercent ?? null;
    updates.release_threshold_cents = input.releaseThresholdCents ?? null;
  }

  return updates;
}

function demoPrizeFromInput(input: ReturnType<typeof instantPrizeCreateSchema.parse>): InstantPrize {
  return {
    id: `demo-prize-${Date.now()}`,
    campaignId: input.campaignId,
    number: input.number,
    title: input.title,
    prizeType: input.prizeType,
    valueCents: input.valueCents ?? undefined,
    extraNumbers: input.extraNumbers ?? undefined,
    description: input.description,
    active: input.active,
    found: false,
    deliveryStatus: "pending",
    releaseRule: input.releaseRule,
    releaseThresholdPercent: input.releaseRule === "after_percent_sold" ? input.releaseThresholdPercent ?? undefined : undefined,
    releaseThresholdCents: input.releaseRule === "after_revenue" ? input.releaseThresholdCents ?? undefined : undefined,
    payoutReserveCents: input.payoutReserveCents,
    publicRuleLabel: input.publicRuleLabel,
  };
}

function mapInstantPrize(data: {
  id: string;
  campaign_id: string;
  number: number;
  title: string;
  prize_type: InstantPrize["prizeType"];
  value_cents?: number | null;
  extra_numbers?: number | null;
  description: string;
  image_url?: string | null;
  active: boolean;
  found: boolean;
  found_by_participant_id?: string | null;
  found_order_id?: string | null;
  activated_at?: string | null;
  found_at?: string | null;
  delivery_status: InstantPrize["deliveryStatus"];
  release_rule: InstantPrize["releaseRule"];
  release_threshold_percent?: number | null;
  release_threshold_cents?: number | null;
  payout_reserve_cents: number;
  public_rule_label: string;
}): InstantPrize {
  return {
    id: data.id,
    campaignId: data.campaign_id,
    number: data.number,
    title: data.title,
    prizeType: data.prize_type,
    valueCents: data.value_cents ?? undefined,
    extraNumbers: data.extra_numbers ?? undefined,
    description: data.description,
    imageUrl: data.image_url ?? undefined,
    active: data.active,
    found: data.found,
    foundByParticipantId: data.found_by_participant_id ?? undefined,
    foundOrderId: data.found_order_id ?? undefined,
    activatedAt: data.activated_at ?? undefined,
    foundAt: data.found_at ?? undefined,
    deliveryStatus: data.delivery_status,
    releaseRule: data.release_rule,
    releaseThresholdPercent: data.release_threshold_percent ?? undefined,
    releaseThresholdCents: data.release_threshold_cents ?? undefined,
    payoutReserveCents: data.payout_reserve_cents,
    publicRuleLabel: data.public_rule_label,
  };
}
