import Link from "next/link";
import {
  BarChart3,
} from "lucide-react";
import { AdminShellFrame } from "./admin-shell";
import type { Campaign, InstantPrize, Order, PrizeAward, Profile } from "@/lib/types";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShellFrame>{children}</AdminShellFrame>;
}

export function AdminDashboard({
  campaigns,
  profiles,
  orders,
  prizes,
  awards,
}: Readonly<{
  campaigns: Campaign[];
  profiles: Profile[];
  orders: Order[];
  prizes: InstantPrize[];
  awards: PrizeAward[];
}>) {
  const approved = orders.filter((order) => order.status === "approved");
  const revenue = approved.reduce((sum, order) => sum + order.totalCents, 0);

  return (
    <div>
      <AdminTitle title="Visao geral" description="Operacao, pagamentos, cotas e alertas de campanha." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Campanhas ativas" value={campaigns.filter((c) => c.status === "active").length.toString()} />
        <AdminMetric label="Participantes" value={profiles.length.toLocaleString("pt-BR")} />
        <AdminMetric label="Receita confirmada" value={formatCurrency(revenue)} />
        <AdminMetric label="Premios pendentes" value={awards.filter((a) => a.status === "pending").length.toString()} tone="gold" />
        <AdminMetric label="Cotas distribuidas" value={campaigns.reduce((s, c) => s + c.confirmedNumbers, 0).toLocaleString("pt-BR")} />
        <AdminMetric label="Pagamentos pendentes" value={orders.filter((o) => o.status === "pending").length.toString()} />
        <AdminMetric label="Premiados ativos" value={prizes.filter((p) => p.active).length.toString()} />
        <AdminMetric label="Premiados encontrados" value={prizes.filter((p) => p.found).length.toString()} tone="success" />
      </div>
      <section className="panel mt-6 p-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-white">
          <BarChart3 className="text-cyan-200" size={20} />
          Alertas
        </h2>
        <div className="mt-4 grid gap-3">
          <p className="alert-line">Webhooks sao idempotentes e armazenados em `payment_events`.</p>
          <p className="alert-line">Publicacao bloqueada para campanhas sem compliance completo.</p>
          <p className="alert-line">Premios encontrados ficam bloqueados contra alteracao de numero, reducao ou exclusao.</p>
        </div>
      </section>
    </div>
  );
}

export function AdminTitle({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <header>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Painel administrativo</p>
      <h1 className="mt-2 text-3xl font-black text-white">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
    </header>
  );
}

function AdminMetric({ label, value, tone }: Readonly<{ label: string; value: string; tone?: "gold" | "success" }>) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={tone === "gold" ? "mt-2 text-2xl font-black text-amber-200" : tone === "success" ? "mt-2 text-2xl font-black text-emerald-200" : "mt-2 text-2xl font-black text-white"}>
        {value}
      </p>
    </div>
  );
}

export function AdminDataTable({
  rows,
}: Readonly<{
  rows: { id: string; cells: React.ReactNode[] }[];
}>) {
  return (
    <div className="table-wrap mt-6">
      <table className="data-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, index) => (
                <td key={index}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CampaignAdminRows({ campaigns }: Readonly<{ campaigns: Campaign[] }>) {
  return (
    <AdminDataTable
      rows={campaigns.map((campaign) => ({
        id: campaign.id,
        cells: [
          <Link key="name" className="font-bold text-cyan-200" href={`/admin/campanhas/${campaign.id}`}>
            {campaign.name}
          </Link>,
          campaign.status,
          `${campaign.confirmedNumbers.toLocaleString("pt-BR")} / ${campaign.totalNumbers.toLocaleString("pt-BR")}`,
          formatCurrency(campaign.pricePerNumberCents),
        ],
      }))}
    />
  );
}

export function OrdersAdminRows({ orders }: Readonly<{ orders: Order[] }>) {
  return (
    <AdminDataTable
      rows={orders.map((order) => ({
        id: order.id,
        cells: [
          order.readableCode,
          order.status,
          order.quantity.toLocaleString("pt-BR"),
          formatCurrency(order.totalCents),
          formatCurrency(order.platformFeeCents),
          formatCurrency(order.adminNetCents),
          formatDateTime(order.createdAt),
        ],
      }))}
    />
  );
}

export function PrizesAdminRows({ prizes }: Readonly<{ prizes: InstantPrize[] }>) {
  return (
    <AdminDataTable
      rows={prizes.map((prize) => ({
        id: prize.id,
        cells: [
          formatNumber(prize.number),
          prize.title,
          prize.active ? "Ativo" : "Desativado",
          prize.found ? "Encontrado" : "Nao encontrado",
          prize.deliveryStatus,
        ],
      }))}
    />
  );
}

export function ConfirmActionDialog() {
  return (
    <div className="rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
      Acoes sensiveis devem abrir confirmacao e registrar motivo em auditoria antes de executar.
    </div>
  );
}

export function AuditHistory() {
  return (
    <div className="grid gap-3">
      {[
        "ativacao de numero premiado",
        "mudanca de preco da campanha",
      ].map((action, index) => (
        <div key={action} className="panel p-4">
          <p className="font-bold text-white">AUD-{index + 1}</p>
          <p className="mt-1 text-sm text-zinc-400">Registro de {action} com dados anteriores, posteriores, IP e responsavel.</p>
        </div>
      ))}
    </div>
  );
}
