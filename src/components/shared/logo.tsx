import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="CotaRush inicio">
      <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.28)]">
        <span className="font-mono text-lg font-black text-cyan-200">CR</span>
      </span>
      <span className="leading-none">
        <span className="block font-mono text-xl font-black uppercase tracking-[0.08em] text-white">
          Cota<span className="text-cyan-300">Rush</span>
        </span>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/80">
          Campanhas Premiadas
        </span>
      </span>
    </Link>
  );
}
