import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?error=admin");
  }

  return <AdminShell>{children}</AdminShell>;
}
