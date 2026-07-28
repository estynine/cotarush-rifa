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

  it("login publico oferece entrada administrativa separada", () => {
    const login = read("src/app/(public)/login/page.tsx");
    expect(login).not.toMatch(/Entrar como ADM|Entrar no painel|Painel do ADM/i);
    expect(login).toContain('href="/admin/login"');
  });

  it("login administrativo possui voltar e entrada demo separada", () => {
    const adminLogin = read("src/app/admin/login/page.tsx");
    expect(adminLogin).toContain('href="/login"');
    expect(adminLogin).toContain('action="/api/auth/demo"');
    expect(adminLogin).toContain('value="admin"');
  });

  it("cadastro gera nome publico automaticamente e mantem demo participante", () => {
    const signupForm = read("src/components/public/signup-form.tsx");
    const signupRoute = read("src/app/api/auth/signup/route.ts");
    expect(signupForm).toContain("buildPublicName(fullName)");
    expect(signupForm).toContain('name="publicName"');
    expect(signupForm).toContain('action="/api/auth/demo"');
    expect(signupRoute).toContain("buildPublicName");
  });

  it("campanhas publicas usam link especifico por adm e campanha", () => {
    const adminPublicPage = read("src/app/(public)/adm/[adminCode]/page.tsx");
    const tenantCampaignPage = read("src/app/(public)/adm/[adminCode]/[campaignSlug]/page.tsx");
    const campaignsPage = read("src/app/(public)/campanhas/page.tsx");
    const campaignCard = read("src/components/public/campaign.tsx");

    expect(adminPublicPage).toContain("/adm/${tenant.inviteCode}/${campaign.slug}");
    expect(campaignsPage).toContain("/adm/${tenant.inviteCode}/${campaign.slug}");
    expect(tenantCampaignPage).toContain("campaign.ownerAdminId !== tenant.id");
    expect(campaignCard).toContain("href?: string");
  });

  it("suporte so aparece quando habilitado e possui numero configurado", () => {
    const publicShell = read("src/components/public/shell.tsx");
    const accountShell = read("src/components/account/shell.tsx");
    const settingsPage = read("src/app/admin/(panel)/configuracoes/page.tsx");
    const supportApi = read("src/app/api/admin/settings/support/route.ts");
    const migration = read("supabase/migrations/20260727203000_admin_support_settings.sql");
    const socialMigration = read("supabase/migrations/20260727220000_admin_social_links_telegram.sql");
    const siteSettings = read("src/lib/site-settings.ts");

    expect(publicShell).toContain("supportEnabled === false");
    expect(publicShell).toContain("if (!url) return null");
    expect(publicShell).toContain("links?.telegram");
    expect(publicShell).toContain("if (items.length === 0) return null");
    expect(accountShell).toContain("supportUrl ? (");
    expect(settingsPage).toContain("Desativar suporte");
    expect(settingsPage).toContain("Telegram");
    expect(settingsPage).toContain("Inspecionar como usuario");
    expect(supportApi).toContain("support_settings");
    expect(supportApi).toContain("social_links");
    expect(supportApi).toContain("telegram");
    expect(siteSettings).toContain("getPublicSocialLinks");
    expect(migration).toContain("enabled boolean");
    expect(migration).toContain("admins manage scoped support settings");
    expect(socialMigration).toContain("telegram text");
    expect(socialMigration).toContain("admins manage scoped social links");
  });

  it("admin pode inspecionar a area publica como usuario com aviso", () => {
    const previewStart = read("src/app/api/admin/preview-user/route.ts");
    const previewExit = read("src/app/api/admin/preview-user/exit/route.ts");
    const publicShell = read("src/components/public/shell.tsx");

    expect(previewStart).toContain("requireAdmin");
    expect(previewStart).toContain("cotarush_user_preview");
    expect(previewExit).toContain("maxAge: 0");
    expect(publicShell).toContain("Voce esta vendo como o usuario veria.");
    expect(publicShell).toContain("/api/admin/preview-user/exit");
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

  it("area do participante filtra dados demo pelo usuario atual", () => {
    const accountOrdersPage = read("src/app/(account)/conta/compras/page.tsx");
    const accountNumbersPage = read("src/app/(account)/conta/numeros/page.tsx");
    const orderApi = read("src/app/api/orders/[orderId]/route.ts");
    const accountAwardsPage = read("src/app/(account)/conta/premiacoes/page.tsx");

    expect(accountOrdersPage).toContain("order.participantId === user.id");
    expect(accountNumbersPage).toContain("allocation.participantId === user.id");
    expect(accountAwardsPage).toContain('redirect("/conta/compras")');
    expect(orderApi).toContain("canReadParticipantResource(user, order.participantId)");
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

describe("controle de premios instantaneos", () => {
  it("painel admin cria e edita numeros premiados manualmente", () => {
    const adminComponents = read("src/components/admin/admin.tsx");
    const prizeControls = read("src/components/admin/instant-prize-controls.tsx");
    const instantPrizeApi = read("src/app/api/admin/instant-prizes/route.ts");
    const migration = read("supabase/migrations/20260727134000_instant_prize_release_controls.sql");
    const manualMigration = read("supabase/migrations/20260727213000_manual_instant_prizes.sql");
    const demoData = read("src/lib/demo-data.ts");

    expect(prizeControls).toContain("Adicionar numero premiado");
    expect(prizeControls).toContain("Nenhum numero premiado cadastrado ainda");
    expect(prizeControls).toContain("Editar");
    expect(prizeControls).toContain("Percentual vendido");
    expect(prizeControls).toContain("Cotas esgotadas");
    expect(prizeControls).toContain("Encontrado e travado");
    expect(prizeControls).toContain("/api/admin/instant-prizes");
    expect(instantPrizeApi).toContain("requireAdmin");
    expect(instantPrizeApi).toContain("export async function POST");
    expect(instantPrizeApi).toContain("instant_prize.create");
    expect(instantPrizeApi).toContain("instant_prize.batch_update");
    expect(adminComponents).toContain("ConfirmActionDialog");
    expect(demoData).toContain("export const demoInstantPrizes: InstantPrize[] = []");
    expect(migration).toContain("instant_prize_found_locked");
    expect(migration).toContain("prevent_found_instant_prize_delete_trigger");
    expect(migration).toContain("instant_prizes_release_controls_valid");
    expect(manualMigration).toContain("instant_prize_is_released");
    expect(manualMigration).toContain("release_threshold_percent");
    expect(manualMigration).toContain("public.instant_prize_is_released(ip, v_campaign, v_projected_numbers) = false");
  });
});

describe("estados vazios", () => {
  it("menus publicos e da conta nao exibem ganhadores ou premiacoes", () => {
    const publicShell = read("src/components/public/shell.tsx");
    const accountShell = read("src/components/account/shell.tsx");

    expect(publicShell).not.toContain("/ganhadores");
    expect(accountShell).not.toContain("/ganhadores");
    expect(accountShell).not.toContain("/conta/premiacoes");
  });
});

describe("multi adm e split financeiro", () => {
  it("cadastro exige codigo unico de adm com 1 letra e 3 numeros", () => {
    const validations = read("src/lib/validations.ts");
    const signup = read("src/app/api/auth/signup/route.ts");
    const migration = read("supabase/migrations/20260727170000_admin_tenant_revenue_split.sql");

    expect(validations).toContain("adminCode");
    expect(validations).toContain("^[A-Z][0-9]{3}$");
    expect(signup).toContain("admin_invite_codes");
    expect(signup).toContain("owner_admin_id");
    expect(migration).toContain("create table public.admin_invite_codes");
    expect(migration).toContain("code text primary key check (code ~ '^[A-Z][0-9]{3}$')");
    expect(migration).toContain("profiles scoped read");
    expect(migration).toContain("admins manage scoped campaigns");
  });

  it("pedidos registram metade da plataforma e metade do adm", () => {
    const ordersApi = read("src/app/api/orders/route.ts");
    const migration = read("supabase/migrations/20260727170000_admin_tenant_revenue_split.sql");
    const paymentsPage = read("src/app/admin/(panel)/pagamentos/page.tsx");
    const paymentAccountApi = read("src/app/api/admin/settings/payment-account/route.ts");
    const paymentAccountMigration = read("supabase/migrations/20260727223000_admin_payment_account_details.sql");

    expect(ordersApi).toContain("calculatePlatformSplit");
    expect(ordersApi).toContain("platform_fee_cents");
    expect(ordersApi).toContain("admin_net_cents");
    expect(paymentsPage).toContain("Configurar recebimento");
    expect(paymentsPage).toContain("50% de cada pagamento aprovado");
    expect(paymentsPage).toContain("Salvar conta de recebimento");
    expect(paymentAccountApi).toContain("admin_payment_accounts");
    expect(paymentAccountApi).toContain("account_reference");
    expect(paymentAccountMigration).toContain("holder_name text");
    expect(paymentAccountMigration).toContain("passaporte");
    expect(migration).toContain("order_revenue_splits");
    expect(migration).toContain("orders_revenue_split_total");
    expect(migration).toContain("can_manage_admin_scope");
    expect(migration).toContain("admins manage scoped allocations");
    expect(migration).toContain("admins manage scoped instant prizes");
  });
});

describe("backend separado", () => {
  it("possui workspace backend separado e proxy de compatibilidade no frontend", () => {
    const packageJson = read("package.json");
    const backendServer = read("apps/backend/src/server.mjs");
    const backendPackage = read("apps/backend/package.json");
    const proxy = read("src/lib/backend-proxy.ts");
    const ordersRoute = read("src/app/api/orders/route.ts");

    expect(packageJson).toContain("apps/backend");
    expect(packageJson).toContain("dev:backend");
    expect(backendPackage).toContain("@cotarush/backend");
    expect(backendServer).toContain("http.createServer");
    expect(backendServer).toContain("/health");
    expect(proxy).toContain("BACKEND_API_URL");
    expect(ordersRoute).toContain('proxyToBackend(request, "/orders")');
  });
});
