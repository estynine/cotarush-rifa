import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { demoAllocations, demoProfiles } from "@/lib/demo-data";
import { parseFormattedNumber } from "@/lib/format";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const number = parseFormattedNumber(url.searchParams.get("number") ?? "");
    const campaignId = url.searchParams.get("campaignId");

    if (!hasSupabaseEnv()) {
      const allocation = demoAllocations.find((item) => item.number === number && (!campaignId || item.campaignId === campaignId));
      const profile = demoProfiles.find((item) => item.id === allocation?.participantId);
      return NextResponse.json({ allocation, profile });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("number_allocations")
      .select("*, profiles(full_name, public_name, email, phone), instant_prizes(title, prize_type, value_cents)")
      .eq("number", number)
      .eq("campaign_id", campaignId)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ result: data });
  } catch (error) {
    const status = error instanceof Error && error.message === "ADMIN_REQUIRED" ? 403 : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Consulta invalida." }, { status });
  }
}
