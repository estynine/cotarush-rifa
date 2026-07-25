import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/shell";
import { demoSocialLinks } from "@/lib/demo-data";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireUser();
  } catch {
    redirect("/login?returnTo=/conta");
  }

  return <AccountShell socialLinks={demoSocialLinks}>{children}</AccountShell>;
}
