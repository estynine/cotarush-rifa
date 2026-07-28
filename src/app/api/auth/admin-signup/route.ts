import { NextResponse } from "next/server";
import { ADMIN_CONTRACT_VERSION } from "@/lib/admin-contract";
import { buildPublicName } from "@/lib/names";
import { getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";
import { adminSignUpSchema } from "@/lib/validations";

function safeString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function redirectWithError(request: Request) {
  return NextResponse.redirect(new URL("/admin/cadastro?error=signup", request.url));
}

function randomAdminCode(): string {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const digits = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${letter}${digits}`;
}

async function createUniqueAdminCode(supabase: ReturnType<typeof getServiceSupabase>): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const code = randomAdminCode();
    const { data } = await supabase.from("admin_invite_codes").select("code").eq("code", code).maybeSingle();
    if (!data) return code;
  }

  throw new Error("Nao foi possivel gerar codigo do ADM.");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const input = adminSignUpSchema.parse({
      fullName: safeString(formData.get("fullName")),
      publicName: safeString(formData.get("publicName")) || buildPublicName(safeString(formData.get("fullName"))),
      email: safeString(formData.get("email")),
      phone: safeString(formData.get("phone")),
      documentNumber: safeString(formData.get("documentNumber")),
      password: safeString(formData.get("password")),
      confirmPassword: safeString(formData.get("confirmPassword")),
      contractVersion: safeString(formData.get("contractVersion")),
      contractAccepted: formData.get("contractAccepted") === "on",
    });

    if (input.contractVersion !== ADMIN_CONTRACT_VERSION) {
      return redirectWithError(request);
    }

    if (!hasSupabaseEnv()) {
      const response = NextResponse.redirect(new URL("/admin", request.url));
      response.cookies.set("cotarush_demo_role", "admin", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      response.cookies.set("cotarush_demo_admin_contract", input.contractVersion, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return response;
    }

    const supabase = getServiceSupabase();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        public_name: input.publicName,
        phone: input.phone,
        document_number: input.documentNumber,
        admin_contract_version: input.contractVersion,
      },
    });

    if (createError || !created.user) throw createError ?? new Error("Usuario nao criado.");

    const adminCode = await createUniqueAdminCode(supabase);
    const userId = created.user.id;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: input.fullName,
      public_name: input.publicName,
      email: input.email,
      phone: input.phone,
      notes: `Documento ADM: ${input.documentNumber}`,
    });
    if (profileError) throw profileError;

    const { error: roleError } = await supabase.from("user_roles").upsert({
      user_id: userId,
      role: "admin",
    });
    if (roleError) throw roleError;

    const { error: codeError } = await supabase.from("admin_invite_codes").insert({
      code: adminCode,
      admin_id: userId,
      active: true,
    });
    if (codeError) throw codeError;

    const { error: profileScopeError } = await supabase
      .from("profiles")
      .update({
        owner_admin_id: userId,
        admin_code: adminCode,
      })
      .eq("id", userId);
    if (profileScopeError) throw profileScopeError;

    const { error: contractError } = await supabase.from("admin_contract_acceptances").insert({
      admin_id: userId,
      contract_version: input.contractVersion,
      accepted: true,
      accepted_at: new Date().toISOString(),
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: request.headers.get("user-agent"),
    });
    if (contractError) throw contractError;

    return NextResponse.redirect(new URL("/admin/login?created=1", request.url));
  } catch {
    return redirectWithError(request);
  }
}
