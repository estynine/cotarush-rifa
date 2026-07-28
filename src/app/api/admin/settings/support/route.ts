import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";

function safeString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableUrl(value: FormDataEntryValue | null): string | null {
  const text = safeString(value);
  return text.length > 0 ? text : null;
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const formData = await request.formData();
    const intent = safeString(formData.get("intent"));
    const supportEnabled = intent === "disable" ? false : formData.get("supportEnabled") === "on";
    const whatsappSupport = safeString(formData.get("whatsappSupport"));
    const supportLabel = safeString(formData.get("supportLabel")) || "Suporte";
    const adminId = user.ownerAdminId ?? user.id;

    if (!hasSupabaseEnv()) {
      return NextResponse.redirect(new URL("/admin/configuracoes?status=saved", request.url));
    }

    const supabase = getServiceSupabase();
    const { error: supportError } = await supabase.from("support_settings").upsert(
      {
        admin_id: adminId,
        enabled: supportEnabled,
        label: supportLabel,
        whatsapp_support: supportEnabled ? whatsappSupport : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "admin_id" },
    );

    if (supportError) throw supportError;

    const { error: socialError } = await supabase.from("social_links").upsert(
      {
        admin_id: adminId,
        scope: "admin",
        whatsapp_group: nullableUrl(formData.get("whatsappGroup")),
        whatsapp_support: supportEnabled ? nullableUrl(formData.get("whatsappSupport")) : null,
        instagram: nullableUrl(formData.get("instagram")),
        tiktok: nullableUrl(formData.get("tiktok")),
        youtube: nullableUrl(formData.get("youtube")),
        telegram: nullableUrl(formData.get("telegram")),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "admin_id" },
    );

    if (socialError) throw socialError;

    return NextResponse.redirect(new URL("/admin/configuracoes?status=saved", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/configuracoes?error=support", request.url));
  }
}
