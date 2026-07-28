import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const adminCode = admin.adminCode ?? "A001";
    const response = NextResponse.redirect(new URL(`/adm/${adminCode}/setup-gamer-dos-sonhos`, request.url));

    response.cookies.set("cotarush_user_preview", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 30,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=admin", request.url));
  }
}
