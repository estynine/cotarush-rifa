import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/shell";
import { requireUser } from "@/lib/auth";
import { getPublicSocialLinks } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireUser();
  } catch {
    redirect("/login?returnTo=/conta");
  }

  const socialLinks = await getPublicSocialLinks();

  return <AccountShell socialLinks={socialLinks}>{children}</AccountShell>;
}
