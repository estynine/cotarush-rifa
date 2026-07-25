import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { campaignSchema } from "@/lib/validations";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = campaignSchema.parse(await request.json());

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ id: crypto.randomUUID(), status: "draft", input });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        name: input.name,
        slug: input.slug,
        title: input.title,
        subtitle: input.subtitle,
        short_description: input.shortDescription,
        full_description: input.fullDescription,
        prize_type: input.prizeType,
        estimated_value_cents: input.estimatedValueCents,
        price_per_number_cents: input.pricePerNumberCents,
        total_numbers: input.totalNumbers,
        max_numbers_per_order: input.maxNumbersPerOrder,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        draw_at: input.drawAt,
        regulation: input.regulation,
        responsible_name: input.responsibleName,
        responsible_document: input.responsibleDocument,
        authorization_number: input.authorizationNumber,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      admin_id: admin.id,
      action: "campaign.create",
      entity: "campaigns",
      entity_id: data.id,
      after_data: input,
    });

    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof Error && error.message === "ADMIN_REQUIRED" ? 403 : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro administrativo." }, { status });
  }
}
