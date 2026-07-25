import { PublicShell } from "@/components/public/shell";
import { demoSocialLinks } from "@/lib/demo-data";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PublicShell socialLinks={demoSocialLinks}>{children}</PublicShell>;
}
