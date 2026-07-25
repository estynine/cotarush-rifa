import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicShell } from "@/components/shell";
import { CampaignCard, CampaignTopTen, DailyBuyerRanking, DailyNumberExtremes } from "@/components/campaign";
import { demoCampaigns, demoCampaignTopTen, demoDailyExtremes, demoDailyRanking, demoSocialLinks } from "@/lib/demo-data";

export default function Home() {
  const campaign = demoCampaigns[0];

  return (
    <PublicShell socialLinks={demoSocialLinks}>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles size={14} />
              Cotas, Pix e premios em tempo real
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              CotaRush
            </h1>
            <p className="mt-4 max-w-2xl text-xl font-semibold text-violet-100">Campanhas Premiadas</p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Plataforma completa para operar campanhas premiadas com numeros de seis digitos, Pix, rankings,
              premiacoes instantaneas, apuracao final e auditoria administrativa.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href={`/campanhas/${campaign.slug}`}>
                Participar agora
                <ArrowRight size={18} />
              </Link>
              <Link className="btn-secondary" href="/login">
                Entrar na conta
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <TrustItem icon={LockKeyhole} text="Segredos fora do frontend" />
              <TrustItem icon={ShieldCheck} text="RLS e APIs protegidas" />
              <TrustItem icon={Sparkles} text="Alocacao transacional" />
            </div>
          </div>
          <CampaignCard campaign={campaign} />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <DailyBuyerRanking entries={demoDailyRanking} />
        <CampaignTopTen entries={demoCampaignTopTen} />
        <DailyNumberExtremes campaign={campaign} extremes={demoDailyExtremes} />
      </section>
    </PublicShell>
  );
}

function TrustItem({ icon: Icon, text }: Readonly<{ icon: LucideIcon; text: string }>) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] p-3 text-sm font-bold text-zinc-200">
      <Icon size={17} className="text-cyan-200" />
      {text}
    </div>
  );
}
