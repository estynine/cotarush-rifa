import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase";

function safeReturnTo(value: FormDataEntryValue | null, fallback: string): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function demoEnabled(): boolean {
  return !hasSupabaseEnv() || process.env.ENABLE_DEMO_LOGIN === "true";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const role = String(formData.get("role") ?? "participant");
  const adminCode = String(formData.get("adminCode") ?? "A001").trim().toUpperCase();
  const isAdmin = role === "admin";
  const fallback = isAdmin ? "/admin" : `/adm/${adminCode || "A001"}/setup-gamer-dos-sonhos`;
  const returnTo = safeReturnTo(formData.get("returnTo"), fallback);

  if (!demoEnabled()) {
    const loginPath = isAdmin ? "/admin/login?error=invalid" : "/login?error=invalid";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const response = NextResponse.redirect(new URL(isAdmin && !returnTo.startsWith("/admin") ? "/admin" : returnTo, request.url));
  response.cookies.set("cotarush_demo_role", isAdmin ? "admin" : "participant", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  response.cookies.set("cotarush_demo_admin_code", adminCode || "A001", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
