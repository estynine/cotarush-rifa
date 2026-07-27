import { PublicShell } from "@/components/public/shell";
import { getCurrentUser } from "@/lib/auth";
import { demoSocialLinks } from "@/lib/demo-data";

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <PublicShell accountHref={user ? "/conta" : "/login?returnTo=/conta"} socialLinks={demoSocialLinks}>
      {children}
    </PublicShell>
  );
}
