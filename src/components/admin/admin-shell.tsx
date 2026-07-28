"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  BarChart3,
  Crown,
  Database,
  Gift,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { href: "/admin", label: "Visao geral", icon: Home },
  { href: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/admin/participantes", label: "Participantes", icon: Users },
  { href: "/admin/pedidos", label: "Pedidos", icon: Receipt },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: BadgeDollarSign },
  { href: "/admin/numeros", label: "Numeros distribuidos", icon: Database },
  { href: "/admin/numeros-premiados", label: "Numeros premiados", icon: Gift },
  { href: "/admin/rankings", label: "Menor e maior do dia", icon: Gift },
  { href: "/admin/rankings", label: "Ranking diario", icon: BarChart3 },
  { href: "/admin/rankings", label: "Top 10", icon: Crown },
  { href: "/admin/configuracoes", label: "Redes sociais", icon: Megaphone },
  { href: "/admin/configuracoes", label: "Suporte", icon: Shield },
  { href: "/admin/configuracoes", label: "Configuracoes", icon: Settings },
  { href: "/admin/auditoria", label: "Auditoria", icon: Shield },
];

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShellFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      <button
        className="icon-button fixed left-3 top-3 z-[70] bg-black/85 shadow-[0_14px_32px_rgba(0,0,0,0.45)]"
        type="button"
        aria-label={open ? "Fechar menu administrativo" : "Abrir menu administrativo"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open ? (
        <button
          className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-[60] flex w-[min(84vw,310px)] flex-col border-r border-white/10 bg-[#050507] p-4 pt-16 shadow-[28px_0_70px_rgba(0,0,0,0.55)] transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="font-mono text-2xl font-black uppercase text-white">
            Cota<span className="text-cyan-300">Rush</span>
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-zinc-300" type="submit">
              <LogOut size={14} />
              <span className="sr-only">Sair</span>
            </button>
          </form>
        </div>
        <nav className="mt-6 grid gap-1 overflow-y-auto pb-4" aria-label="Administrativo">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isCurrentPath(pathname, item.href);

            return (
              <Link
                key={`${item.href}-${item.label}`}
                className={active ? "admin-nav-link bg-white/[0.09] text-white" : "admin-nav-link"}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="mx-auto min-h-screen w-full max-w-6xl p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-20">{children}</main>
    </div>
  );
}
