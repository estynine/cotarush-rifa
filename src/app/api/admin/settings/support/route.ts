import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";

function safeString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const formData = await request.formData();
    const intent = safeString(formData.get("intent"));
    const supportEnabled = intent === "disable" ? false : formData.get("supportEnabled") === "on";
    const whatsappSupport = safeString(formData.get("whatsappSupport"));
    const supportLabel = safeString(formData.get("supportLabel")) || "Suporte";

    if (!hasSupabaseEnv()) {
      return NextResponse.redirect(new URL("/admin/configuracoes?status=saved", request.url));
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from("support_settings").upsert(
      {
        admin_id: user.ownerAdminId ?? user.id,
        enabled: supportEnabled,
        label: supportLabel,
        whatsapp_support: supportEnabled ? whatsappSupport : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "admin_id" },
    );

    if (error) throw error;

    return NextResponse.redirect(new URL("/admin/configuracoes?status=saved", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/configuracoes?error=support", request.url));
  }
}
