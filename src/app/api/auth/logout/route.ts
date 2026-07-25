import { NextResponse } from "next/server";
import { getServerSupabase, hasSupabaseEnv } from "@/lib/supabase";

export async function POST(request: Request) {
  if (hasSupabaseEnv()) {
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("cotarush_demo_role", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
