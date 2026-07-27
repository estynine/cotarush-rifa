import { cookies } from "next/headers";
import { hasSupabaseEnv, getServerSupabase } from "./supabase";
import { canAccessAdmin } from "./authorization";

export type AuthUser = {
  id: string;
  email?: string;
  role: "participant" | "admin" | "super_admin";
  ownerAdminId?: string;
  adminCode?: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!hasSupabaseEnv()) {
    const cookieStore = await cookies();
    const role = cookieStore.get("cotarush_demo_role")?.value;

    if (role === "admin" || role === "super_admin") {
      return {
        id: "99999999-9999-4999-8999-999999999999",
        email: process.env.ADMIN_EMAIL ?? "adm@cotarush.local",
        role,
        ownerAdminId: "99999999-9999-4999-8999-999999999999",
        adminCode: "A001",
      };
    }

    if (role === "participant") {
      return {
        id: "11111111-1111-4111-8111-111111111111",
        email: "participante@cotarush.local",
        role: "participant",
        ownerAdminId: "99999999-9999-4999-8999-999999999999",
        adminCode: cookieStore.get("cotarush_demo_admin_code")?.value ?? "A001",
      };
    }

    return null;
  }

  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, owner_admin_id, admin_code, user_roles(role)")
    .eq("id", data.user.id)
    .single();

  const roles = profile?.user_roles as unknown;
  const role = Array.isArray(roles) ? (roles[0] as { role?: AuthUser["role"] } | undefined)?.role : undefined;

  return {
    id: data.user.id,
    email: data.user.email,
    role: role === "admin" || role === "super_admin" ? role : "participant",
    ownerAdminId: profile?.owner_admin_id ?? undefined,
    adminCode: profile?.admin_code ?? undefined,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (!canAccessAdmin(user)) {
    throw new Error("ADMIN_REQUIRED");
  }
  return user;
}
