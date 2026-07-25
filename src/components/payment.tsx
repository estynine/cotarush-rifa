"use client";

import { CheckCircle2, Copy, Loader2, QrCode, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { PixPayment } from "@/lib/types";

export function PixPaymentCard({ initialPayment }: Readonly<{ initialPayment: PixPayment }>) {
  const [payment, setPayment] = useState(initialPayment);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (payment.status === "approved") return;
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/orders/${payment.orderId}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { payment?: PixPayment };
      if (payload.payment) setPayment(payload.payment);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [payment.orderId, payment.status]);

  async function copyCode() {
    await navigator.clipboard.writeText(payment.copyPasteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="panel mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-3">
        {payment.status === "approved" ? (
          <CheckCircle2 className="text-emerald-300" />
        ) : (
          <Loader2 className="animate-spin text-cyan-200" />
        )}
        <div>
          <h1 className="text-2xl font-black text-white">Pagamento Pix</h1>
          <p className="text-sm text-zinc-400">Atualizacao automatica apos confirmacao oficial.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-[220px_1fr]">
        <div className="grid aspect-square place-items-center rounded-lg border border-white/10 bg-white p-4 text-zinc-950">
          {payment.qrCodeBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="QR Code Pix" src={`data:image/png;base64,${payment.qrCodeBase64}`} className="h-full w-full" />
          ) : (
            <div className="grid place-items-center text-center">
              <QrCode size={72} />
              <span className="mt-3 text-xs font-bold">QR demo</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">Codigo copia e cola</p>
          <textarea className="form-input mt-3 min-h-32 resize-none text-xs" readOnly value={payment.copyPasteCode} />
          <button className="btn-secondary mt-3" type="button" onClick={copyCode}>
            <Copy size={16} />
            {copied ? "Copiado" : "Copiar codigo Pix"}
          </button>
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <p className="flex items-center gap-2 text-sm text-zinc-300">
          <RefreshCw size={15} />
          Status: <span className="font-black text-cyan-200">{payment.status}</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">Expira em: {new Date(payment.expiresAt).toLocaleString("pt-BR")}</p>
      </div>
    </section>
  );
}
