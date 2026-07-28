import { cookies } from "next/headers";
import { PublicShell } from "@/components/public/shell";
import { getCurrentUser } from "@/lib/auth";
import { getPublicSocialLinks } from "@/lib/site-settings";

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const previewMode = cookieStore.get("cotarush_user_preview")?.value === "1";
  const socialLinks = await getPublicSocialLinks();

  return (
    <PublicShell accountHref={user ? "/conta" : "/login?returnTo=/conta"} socialLinks={socialLinks} previewMode={previewMode}>
      {children}
    </PublicShell>
  );
}
