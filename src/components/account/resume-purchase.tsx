"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type PendingPurchase = {
  campaignId: string;
  quantity: number;
  slug: string;
};

export function ResumePurchase() {
  const [message, setMessage] = useState("Retomando sua compra...");

  useEffect(() => {
    async function resume() {
      const raw = sessionStorage.getItem("cotarush.pendingPurchase");
      if (!raw) {
        window.location.href = "/conta";
        return;
      }

      const pending = JSON.parse(raw) as PendingPurchase;
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: pending.campaignId, quantity: pending.quantity }),
      });

      const payload = (await response.json()) as { orderId?: string; error?: string };
      if (!response.ok || !payload.orderId) {
        setMessage(payload.error ?? "Nao foi possivel retomar a compra.");
        return;
      }

      sessionStorage.removeItem("cotarush.pendingPurchase");
      window.location.href = `/pagamento/${payload.orderId}`;
    }

    void resume();
  }, []);

  return (
    <section className="px-4 py-12">
      <div className="panel mx-auto max-w-lg p-6 text-center">
        <Loader2 className="mx-auto animate-spin text-cyan-200" size={34} />
        <h1 className="mt-4 text-2xl font-black text-white">Compra preservada</h1>
        <p className="mt-2 text-sm text-zinc-400">{message}</p>
      </div>
    </section>
  );
}
