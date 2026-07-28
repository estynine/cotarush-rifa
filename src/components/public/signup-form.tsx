"use client";

import { useMemo, useState } from "react";
import { buildPublicName } from "@/lib/names";

export function SignupForm({ defaultAdminCode }: Readonly<{ defaultAdminCode: string }>) {
  const [fullName, setFullName] = useState("");
  const publicName = useMemo(() => buildPublicName(fullName), [fullName]);

  return (
    <div className="grid gap-3">
      <form className="grid gap-3" action="/api/auth/signup" method="post">
        <input
          className="form-input"
          name="fullName"
          placeholder="Nome e sobrenome"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          required
        />
        <input
          className="form-input"
          name="publicName"
          placeholder="Nome que aparece na plataforma"
          value={publicName}
          readOnly
          required
        />
        <input className="form-input" name="email" type="email" placeholder="E-mail" autoComplete="email" required />
        <input className="form-input" name="phone" inputMode="numeric" placeholder="Telefone" autoComplete="tel" required />
        <input
          className="form-input uppercase"
          name="adminCode"
          inputMode="text"
          pattern="[A-Za-z][0-9]{3}"
          placeholder="Codigo do ADM. Ex: A001"
          defaultValue={defaultAdminCode}
          required
        />
        <input className="form-input" name="password" type="password" placeholder="Senha" autoComplete="new-password" required />
        <input className="form-input" name="confirmPassword" type="password" placeholder="Confirmar senha" autoComplete="new-password" required />
        <label className="flex gap-3 text-sm text-zinc-300">
          <input name="termsAccepted" type="checkbox" required /> Aceito os Termos de Uso.
        </label>
        <label className="flex gap-3 text-sm text-zinc-300">
          <input name="privacyAccepted" type="checkbox" required /> Aceito a Politica de Privacidade.
        </label>
        <button className="btn-primary w-full" type="submit">
          Criar conta
        </button>
      </form>
      <form action="/api/auth/demo" method="post">
        <input type="hidden" name="role" value="participant" />
        <input type="hidden" name="adminCode" value={defaultAdminCode || "A001"} />
        <input type="hidden" name="returnTo" value={`/adm/${defaultAdminCode || "A001"}/setup-gamer-dos-sonhos`} />
        <button className="btn-secondary w-full" type="submit">
          Entrar demo participante
        </button>
      </form>
    </div>
  );
}
