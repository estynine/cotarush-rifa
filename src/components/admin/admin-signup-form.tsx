"use client";

import { useMemo, useState } from "react";
import { ADMIN_CONTRACT_VERSION, adminContractSections } from "@/lib/admin-contract";
import { buildPublicName } from "@/lib/names";

export function AdminSignupForm() {
  const [fullName, setFullName] = useState("");
  const [contractRead, setContractRead] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const publicName = useMemo(() => buildPublicName(fullName), [fullName]);

  function handleContractScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const reachedEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 12;
    if (reachedEnd) setContractRead(true);
  }

  return (
    <form className="grid gap-3" action="/api/auth/admin-signup" method="post">
      <input type="hidden" name="contractVersion" value={ADMIN_CONTRACT_VERSION} />
      <input
        className="form-input"
        name="fullName"
        placeholder="Nome completo do ADM"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        autoComplete="name"
        required
      />
      <input className="form-input" name="publicName" placeholder="Nome publico do ADM" value={publicName} readOnly required />
      <input className="form-input" name="email" type="email" placeholder="E-mail do ADM" autoComplete="email" required />
      <input className="form-input" name="phone" inputMode="numeric" placeholder="Telefone" autoComplete="tel" required />
      <input className="form-input" name="documentNumber" placeholder="CPF, CNPJ ou passaporte" required />
      <input className="form-input" name="password" type="password" placeholder="Senha" autoComplete="new-password" required />
      <input className="form-input" name="confirmPassword" type="password" placeholder="Confirmar senha" autoComplete="new-password" required />

      <section className="mt-2 rounded-lg border border-white/10 bg-black/25 p-3">
        <h2 className="text-base font-black text-white">Contrato da clausula</h2>
        <div className="mt-3 max-h-[310px] overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-6 text-zinc-300" onScroll={handleContractScroll}>
          {adminContractSections.map((section) => (
            <section key={section.title} className="mb-5">
              <h3 className="font-black text-cyan-100">{section.title}</h3>
              <p className="mt-2">{section.body}</p>
            </section>
          ))}
        </div>
        <label className="mt-3 flex gap-3 text-sm text-zinc-300">
          <input
            name="contractAccepted"
            type="checkbox"
            disabled={!contractRead}
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            required
          />
          Li todo o contrato, entendi a taxa de 50% e aceito as responsabilidades do ADM.
        </label>
        {!contractRead ? <p className="mt-2 text-xs text-amber-100">Role o contrato ate o final para liberar o aceite.</p> : null}
      </section>

      <button className="btn-primary w-full" type="submit" disabled={!contractRead || !accepted}>
        Criar conta ADM
      </button>
    </form>
  );
}
