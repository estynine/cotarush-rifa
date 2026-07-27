import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { instantPrizeBatchControlSchema, instantPrizeControlSchema } from "@/lib/validations";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";

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

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
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
