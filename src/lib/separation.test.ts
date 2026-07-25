import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { canAccessAccount, canAccessAdmin, canReadParticipantResource } from "./authorization";

const root = process.cwd();

function filesUnder(relativeDir: string): string[] {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];

  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) return filesUnder(entryPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("separacao visual e imports", () => {
  it("area publica nao importa componentes administrativos ou de participante", () => {
    const offenders = filesUnder("src/app/(public)")
      .concat(filesUnder("src/components/public"))
      .filter((file) => /@\/components\/(admin|account)/.test(read(file)));

    expect(offenders).toEqual([]);
  });

  it("area do participante nao importa componentes administrativos", () => {
    const offenders = filesUnder("src/app/(account)")
      .concat(filesUnder("src/components/account"))
      .filter((file) => /@\/components\/admin/.test(read(file)));

    expect(offenders).toEqual([]);
  });

  it("painel administrativo nao importa componentes publicos ou de participante", () => {
    const offenders = filesUnder("src/app/admin")
      .concat(filesUnder("src/components/admin"))
      .filter((file) => /@\/components\/(public|account)/.test(read(file)));

    expect(offenders).toEqual([]);
  });

  it("login publico nao oferece entrada administrativa", () => {
    const login = read("src/app/(public)/login/page.tsx");
    expect(login).not.toMatch(/Entrar como ADM|Entrar no painel|Painel do ADM/i);
    expect(login).not.toContain('href="/admin');
  });
});

describe("permissoes server-side", () => {
  const participant = { id: "participant-1", role: "participant" as const };
  const admin = { id: "admin-1", role: "admin" as const };

  it("/admin rejeita participante comum", () => {
    expect(canAccessAdmin(participant)).toBe(false);
    expect(canAccessAdmin(admin)).toBe(true);
  });

  it("/conta rejeita visitante", () => {
    expect(canAccessAccount(null)).toBe(false);
    expect(canAccessAccount(participant)).toBe(true);
  });

  it("participante so consulta o proprio pedido", () => {
    expect(canReadParticipantResource(participant, "participant-1")).toBe(true);
    expect(canReadParticipantResource(participant, "participant-2")).toBe(false);
    expect(canReadParticipantResource(admin, "participant-2")).toBe(true);
  });

  it("participante so consulta os proprios numeros", () => {
    expect(canReadParticipantResource(participant, "participant-1")).toBe(true);
    expect(canReadParticipantResource(participant, "other")).toBe(false);
  });
});

describe("retomada de compra", () => {
  it("mantem quantidade apos login por sessionStorage e rota de retomada", () => {
    const quantitySelector = read("src/components/public/quantity-selector.tsx");
    const resumePurchase = read("src/components/account/resume-purchase.tsx");

    expect(quantitySelector).toContain("cotarush.pendingPurchase");
    expect(quantitySelector).toContain("/login?returnTo=/pagamento/retomar");
    expect(resumePurchase).toContain("sessionStorage.getItem(\"cotarush.pendingPurchase\")");
    expect(resumePurchase).toContain("fetch(\"/api/orders\"");
  });
});
