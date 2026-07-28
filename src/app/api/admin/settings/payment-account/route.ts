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
    const adminId = user.ownerAdminId ?? user.id;
    const accountReference = safeString(formData.get("accountReference"));

    if (!accountReference) {
      return NextResponse.redirect(new URL("/admin/pagamentos?error=payment-account", request.url));
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.redirect(new URL("/admin/pagamentos?status=payment-account-saved", request.url));
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from("admin_payment_accounts").upsert(
      {
        admin_id: adminId,
        provider: safeString(formData.get("provider")) || "mercado_pago",
        account_reference: accountReference,
        label: safeString(formData.get("label")) || "Conta de recebimento do ADM",
        holder_name: safeString(formData.get("holderName")) || null,
        document_type: safeString(formData.get("documentType")) || null,
        document_number: safeString(formData.get("documentNumber")) || null,
        pix_key_type: safeString(formData.get("pixKeyType")) || null,
        pix_key: safeString(formData.get("pixKey")) || null,
        bank_name: safeString(formData.get("bankName")) || null,
        branch_number: safeString(formData.get("branchNumber")) || null,
        account_number: safeString(formData.get("accountNumber")) || null,
        account_type: safeString(formData.get("accountType")) || null,
        active: formData.get("active") === "on",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "admin_id" },
    );

    if (error) throw error;

    return NextResponse.redirect(new URL("/admin/pagamentos?status=payment-account-saved", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/pagamentos?error=payment-account", request.url));
  }
}
