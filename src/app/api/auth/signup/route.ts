import { NextResponse } from "next/server";
import { demoAdminTenants } from "@/lib/demo-data";
import { proxyToBackend } from "@/lib/backend-proxy";
import { buildPublicName } from "@/lib/names";
import { getServerSupabase, getServiceSupabase, hasSupabaseEnv } from "@/lib/supabase";
import { signUpSchema } from "@/lib/validations";

function safeString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const proxied = await proxyToBackend(request, "/auth/signup");
  if (proxied) return proxied;

  try {
    const formData = await request.formData();
    const input = signUpSchema.parse({
      fullName: safeString(formData.get("fullName")),
      publicName: safeString(formData.get("publicName")) || buildPublicName(safeString(formData.get("fullName"))),
      email: safeString(formData.get("email")),
      phone: safeString(formData.get("phone")),
      adminCode: safeString(formData.get("adminCode")),
      password: safeString(formData.get("password")),
      confirmPassword: safeString(formData.get("confirmPassword")),
      termsAccepted: formData.get("termsAccepted") === "on",
      privacyAccepted: formData.get("privacyAccepted") === "on",
    });

    if (!hasSupabaseEnv()) {
      const tenant = demoAdminTenants.find((admin) => admin.inviteCode === input.adminCode);
      if (!tenant) return NextResponse.redirect(new URL("/cadastro?error=admin-code", request.url));

      const response = NextResponse.redirect(new URL("/conta", request.url));
      response.cookies.set("cotarush_demo_role", "participant", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      response.cookies.set("cotarush_demo_admin_code", input.adminCode, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return response;
    }

    const serviceSupabase = getServiceSupabase();
    const { data: adminCode, error: adminCodeError } = await serviceSupabase
      .from("admin_invite_codes")
      .select("code, admin_id")
      .eq("code", input.adminCode)
      .eq("active", true)
      .single();

    if (adminCodeError || !adminCode) {
      return NextResponse.redirect(new URL("/cadastro?error=admin-code", request.url));
    }

    const supabase = await getServerSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          public_name: input.publicName,
          phone: input.phone,
          owner_admin_id: adminCode.admin_id,
          admin_code: input.adminCode,
        },
      },
    });

    if (error || !data.user) {
      return NextResponse.redirect(new URL("/cadastro?error=signup", request.url));
    }

    const { error: profileError } = await serviceSupabase.from("profiles").upsert({
      id: data.user.id,
      owner_admin_id: adminCode.admin_id,
      admin_code: input.adminCode,
      full_name: input.fullName,
      public_name: input.publicName,
      email: input.email,
      phone: input.phone,
    });
    if (profileError) throw profileError;

    const { error: roleError } = await serviceSupabase.from("user_roles").upsert({
      user_id: data.user.id,
      role: "participant",
    });
    if (roleError) throw roleError;

    return NextResponse.redirect(new URL("/conta", request.url));
  } catch {
    return NextResponse.redirect(new URL("/cadastro?error=signup", request.url));
  }
}
