import { NextResponse } from "next/server";
import { getServerSupabase, hasSupabaseEnv } from "@/lib/supabase";

function safeReturnTo(value: FormDataEntryValue | null): string {
  const fallback = "/conta";
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", returnTo);

  if (!hasSupabaseEnv()) {
    const adminEmail = (process.env.ADMIN_EMAIL ?? "adm@cotarush.local").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD ?? "CotaRush@2026";

    if (email !== adminEmail || password !== adminPassword) {
      loginUrl.searchParams.set("error", "invalid");
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.redirect(new URL(returnTo.startsWith("/admin") ? returnTo : "/admin", request.url));
    response.cookies.set("cotarush_demo_role", "admin", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    loginUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
  const isAdmin = roles?.some((item) => item.role === "admin" || item.role === "super_admin") ?? false;

  if (returnTo.startsWith("/admin") && !isAdmin) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "admin");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(returnTo.startsWith("/admin") ? "/admin" : returnTo, request.url));
}
