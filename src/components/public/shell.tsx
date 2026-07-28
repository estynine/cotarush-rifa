import Link from "next/link";
import { Camera, LifeBuoy, ShieldCheck, Trophy, UserRound, Video } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import type { SocialLinks } from "@/lib/types";

const navItems = [
  { href: "/campanhas", label: "Campanhas" },
  { href: "/termos", label: "Termos" },
];

export function PublicShell({
  children,
  accountHref,
  socialLinks,
}: Readonly<{ children: React.ReactNode; accountHref: string; socialLinks?: SocialLinks }>) {
  const supportUrl = socialLinks?.supportEnabled === false ? undefined : socialLinks?.whatsappSupport;

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.2),transparent_30%),linear-gradient(180deg,#050507,#0b0b12_45%,#050507)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050507] shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <Logo />
          <div className="flex shrink-0 items-center gap-2">
            <Link className="btn-primary px-3 text-xs" href="/campanhas">
              Comprar
            </Link>
            <Link className="icon-button" href={accountHref} aria-label="Conta">
              <UserRound size={18} />
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-xl gap-2 overflow-x-auto px-3 pb-3 text-sm sm:px-4" aria-label="Principal">
          {navItems.map((item) => (
            <Link key={item.href} className="nav-link shrink-0" href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link className="nav-link shrink-0" href={accountHref}>
            Minha conta
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/10 bg-black/70">
        <div className="mx-auto grid max-w-xl gap-8 px-4 py-10 sm:px-6">
          <div>
            <Logo />
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">
              Plataforma para campanhas premiadas com Pix, cotas numeradas, rankings e suporte aos participantes.
            </p>
            <p className="mt-4 text-xs text-zinc-500">© 2026 CotaRush. Todos os direitos reservados.</p>
            <p className="text-xs text-zinc-500">Desenvolvido por ST9.sheet</p>
          </div>
          <div className="grid gap-2 text-sm text-zinc-300">
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/privacidade">Politica de Privacidade</Link>
            <Link href="/regulamento/setup-gamer-dos-sonhos">Regulamento</Link>
          </div>
          <SocialLinks links={socialLinks} />
        </div>
      </footer>
      <FloatingSupportButton label={socialLinks?.supportLabel} url={supportUrl} />
    </div>
  );
}

export function SocialLinks({ links }: Readonly<{ links?: SocialLinks }>) {
  const items = [
    { href: links?.instagram, label: "Instagram", icon: Camera },
    { href: links?.youtube, label: "YouTube", icon: Video },
    { href: links?.whatsappGroup, label: "Grupo WhatsApp", icon: Trophy },
  ].filter((item) => item.href);

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">Redes e suporte</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.label} className="icon-button" href={item.href} rel="noreferrer noopener" target="_blank">
              <Icon size={18} />
              <span className="sr-only">{item.label}</span>
            </a>
          );
        })}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
        <ShieldCheck size={16} className="text-emerald-300" />
        Links abertos com protecao de origem.
      </p>
    </div>
  );
}

function FloatingSupportButton({ label = "Suporte", url }: Readonly<{ label?: string; url?: string }>) {
  if (!url) return null;

  return (
    <a
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400 px-4 py-3 text-sm font-black text-emerald-950 shadow-[0_0_35px_rgba(52,211,153,0.35)]"
      href={url}
      target="_blank"
      rel="noreferrer noopener"
    >
      <LifeBuoy size={18} />
      {label}
    </a>
  );
}
