import type { AuthUser } from "./auth";

export function isAdminRole(role: AuthUser["role"] | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

export function canAccessAdmin(user: Pick<AuthUser, "role"> | null): boolean {
  return Boolean(user && isAdminRole(user.role));
}

export function canAccessAccount(user: Pick<AuthUser, "role"> | null): boolean {
  return Boolean(user);
}

export function canReadParticipantResource(
  user: Pick<AuthUser, "id" | "role"> | null,
  ownerId: string,
): boolean {
  if (!user) return false;
  return user.id === ownerId || isAdminRole(user.role);
}
