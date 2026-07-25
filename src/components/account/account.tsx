"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { NumberAllocation, Order, PrizeAward } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";

export function OrdersTable({ orders }: Readonly<{ orders: Order[] }>) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cotas</th>
            <th>Total</th>
            <th>Status</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.readableCode}</td>
              <td>{order.quantity.toLocaleString("pt-BR")}</td>
              <td>{formatCurrency(order.totalCents)}</td>
              <td>
                <span className="status-pill">{order.status}</span>
              </td>
              <td>{formatDateTime(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MyNumbersGrid({ allocations }: Readonly<{ allocations: NumberAllocation[] }>) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.replace(/\D/g, "");
    return allocations
      .filter((allocation) => !normalized || allocation.number.toString().padStart(6, "0").includes(normalized))
      .sort((a, b) => a.number - b.number)
      .slice(0, 300);
  }, [allocations, query]);

  const groups = useMemo(() => {
    return filtered.reduce<Record<string, NumberAllocation[]>>((acc, allocation) => {
      const key = formatDate(allocation.allocationDate);
      acc[key] = acc[key] ?? [];
      acc[key].push(allocation);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div>
      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
        <input
          className="form-input pl-10"
          placeholder="Pesquisar numero"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <p className="mt-3 text-sm text-zinc-500">Exibindo no maximo 300 itens por vez para manter a tela rapida.</p>
      <div className="mt-6 grid gap-6">
        {Object.entries(groups).map(([date, numbers]) => (
          <section key={date} className="panel p-4">
            <h2 className="font-black text-white">
              {date} - {numbers.length.toLocaleString("pt-BR")} numeros
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {numbers.map((allocation) => (
                <span
                  key={allocation.id}
                  className={
                    allocation.status === "invalidated"
                      ? "number-chip number-invalid"
                      : allocation.awarded
                        ? "number-chip number-awarded"
                        : "number-chip"
                  }
                >
                  {formatNumber(allocation.number)}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function AwardsList({ awards }: Readonly<{ awards: PrizeAward[] }>) {
  return (
    <div className="grid gap-3">
      {awards.length === 0 ? (
        <p className="empty-state">Voce ainda nao possui premiacoes.</p>
      ) : (
        awards.map((award) => (
          <article key={award.id} className="panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">{award.category}</p>
                <h2 className="mt-2 text-xl font-black text-white">{award.description}</h2>
                <p className="mt-1 text-sm text-zinc-400">Codigo: {award.validationCode}</p>
              </div>
              <span className="status-pill">{award.status}</span>
            </div>
            {award.number !== undefined ? <p className="mt-4 font-mono text-2xl font-black text-emerald-200">{formatNumber(award.number)}</p> : null}
            {award.valueCents ? <p className="mt-2 font-black text-amber-100">{formatCurrency(award.valueCents)}</p> : null}
          </article>
        ))
      )}
    </div>
  );
}
