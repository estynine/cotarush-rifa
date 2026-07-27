import Link from "next/link";
import { LifeBuoy, LogOut } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import type { SocialLinks } from "@/lib/types";

const accountNavItems = [
  { href: "/", label: "Inicio" },
  { href: "/campanhas", label: "Campanhas" },
  { href: "/conta/numeros", label: "Meus numeros" },
  { href: "/conta/compras", label: "Minhas compras" },
  { href: "/conta/premiacoes", label: "Minhas premiacoes" },
  { href: "/ganhadores", label: "Ganhadores" },
  { href: "/conta/perfil", label: "Minha conta" },
];

export function AccountShell({
  children,
  socialLinks,
}: Readonly<{ children: React.ReactNode; socialLinks?: SocialLinks }>) {
  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.14),transparent_30%),linear-gradient(180deg,#050507,#0b0b12_45%,#050507)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050507] shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex max-w-xl flex-col gap-4 px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <Logo />
            <form action="/api/auth/logout" method="post">
              <button className="btn-secondary" type="submit">
                <LogOut size={16} />
                Sair
              </button>
            </form>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Menu do participante">
            {accountNavItems.map((item) => (
              <Link key={item.href} className="nav-link shrink-0" href={item.href}>
                {item.label}
              </Link>
            ))}
            <a className="nav-link shrink-0" href={socialLinks?.whatsappSupport ?? "/conta"} target={socialLinks?.whatsappSupport ? "_blank" : undefined}>
              Suporte
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-xl">{children}</main>
      <a
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400 px-4 py-3 text-sm font-black text-emerald-950 shadow-[0_0_35px_rgba(52,211,153,0.35)]"
        href={socialLinks?.whatsappSupport ?? "/conta"}
        target={socialLinks?.whatsappSupport ? "_blank" : undefined}
        rel={socialLinks?.whatsappSupport ? "noreferrer noopener" : undefined}
      >
        <LifeBuoy size={18} />
        Suporte
      </a>
    </div>
  );
}
