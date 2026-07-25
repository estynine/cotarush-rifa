"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { Campaign } from "@/lib/types";
import { calculateOrderTotal, formatCurrency } from "@/lib/format";

const quickAmounts = [100, 200, 300, 500, 1000, 5000, 10000];

export function QuantitySelector({ campaign }: Readonly<{ campaign: Campaign }>) {
  const [quantity, setQuantity] = useState(100);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(
    () => calculateOrderTotal(campaign.pricePerNumberCents, quantity),
    [campaign.pricePerNumberCents, quantity],
  );

  function clamp(value: number) {
    return Math.max(1, Math.min(campaign.maxNumbersPerOrder, value));
  }

  function buyNow() {
    setMessage(null);
    startTransition(async () => {
      sessionStorage.setItem(
        "cotarush.pendingPurchase",
        JSON.stringify({ campaignId: campaign.id, quantity, slug: campaign.slug }),
      );

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, quantity }),
      });

      if (response.status === 401) {
        window.location.href = `/login?returnTo=/pagamento/retomar`;
        return;
      }

      const payload = (await response.json()) as { orderId?: string; error?: string };
      if (!response.ok || !payload.orderId) {
        setMessage(payload.error ?? "Nao foi possivel iniciar a compra.");
        return;
      }

      window.location.href = `/pagamento/${payload.orderId}`;
    });
  }

  return (
    <div className="mt-5">
      <div className="grid grid-cols-[44px_1fr_44px] gap-2">
        <button className="icon-button" type="button" aria-label="Diminuir cotas" onClick={() => setQuantity((q) => clamp(q - 1))}>
          <Minus size={18} />
        </button>
        <input
          className="form-input text-center font-mono text-lg font-black"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => setQuantity(clamp(Number(event.target.value.replace(/\D/g, "")) || 1))}
          aria-label="Quantidade de cotas"
        />
        <button className="icon-button" type="button" aria-label="Aumentar cotas" onClick={() => setQuantity((q) => clamp(q + 1))}>
          <Plus size={18} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {quickAmounts.map((amount) => (
          <button key={amount} className="quick-button" type="button" onClick={() => setQuantity((q) => clamp(q + amount))}>
            +{amount.toLocaleString("pt-BR")}
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-white/10 bg-black/35 p-4">
        <p className="text-sm text-zinc-400">
          {quantity.toLocaleString("pt-BR")} cotas x {formatCurrency(campaign.pricePerNumberCents)}
        </p>
        <p className="mt-1 text-2xl font-black text-white">{formatCurrency(total)}</p>
      </div>
      {message ? <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{message}</p> : null}
      <button className="btn-primary mt-4 w-full" type="button" disabled={isPending} onClick={buyNow}>
        <ShoppingCart size={18} />
        {isPending ? "Preparando Pix..." : "Comprar agora"}
      </button>
    </div>
  );
}
