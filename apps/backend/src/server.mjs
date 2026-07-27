import http from "node:http";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const port = Number(process.env.BACKEND_PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const adminCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z][0-9]{3}$/);
const signupSchema = z.object({
  fullName: z.string().trim().min(3),
  publicName: z.string().trim().min(2),
  email: z.email().toLowerCase(),
  phone: z.string().trim().min(10).max(13),
  adminCode: adminCodeSchema,
  password: z.string().min(8),
  confirmPassword: z.string(),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
}).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"] });

const orderSchema = z.object({
  campaignId: z.uuid(),
  quantity: z.coerce.number().int().positive().max(10000),
});

const campaignSchema = z.object({
  name: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3),
  subtitle: z.string().min(3),
  shortDescription: z.string().min(10),
  fullDescription: z.string().min(20),
  prizeType: z.enum(["money", "product", "extra_numbers", "credit", "other"]),
  estimatedValueCents: z.coerce.number().int().nonnegative(),
  pricePerNumberCents: z.coerce.number().int().positive(),
  totalNumbers: z.coerce.number().int().positive().max(1000000),
  maxNumbersPerOrder: z.coerce.number().int().positive().max(10000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  drawAt: z.string().datetime(),
  regulation: z.string().min(20),
  responsibleName: z.string().min(3),
  responsibleDocument: z.string().min(3),
  authorizationNumber: z.string().optional(),
});

const instantPrizeControlSchema = z.object({
  prizeId: z.string().trim().min(1).optional(),
  campaignId: z.uuid().optional(),
  active: z.boolean().optional(),
  valueCents: z.number().int().nonnegative().nullable().optional(),
  payoutReserveCents: z.number().int().nonnegative().optional(),
  releaseRule: z.enum(["manual", "after_percent_sold", "after_revenue", "sold_out"]).optional(),
  releaseThresholdPercent: z.number().min(0).max(100).nullable().optional(),
  releaseThresholdCents: z.number().int().nonnegative().nullable().optional(),
  publicRuleLabel: z.string().trim().min(3).max(180).optional(),
  reason: z.string().trim().min(3).max(400).optional(),
});

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabase() {
  if (!hasSupabaseEnv()) throw new Error("Supabase service role nao configurado.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function json(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": frontendOrigin,
    "access-control-allow-credentials": "true",
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function redirect(response, location, headers = {}) {
  response.writeHead(303, {
    location,
    "access-control-allow-origin": frontendOrigin,
    "access-control-allow-credentials": "true",
    ...headers,
  });
  response.end();
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function readJson(request) {
  const raw = await readBody(request);
  return raw ? JSON.parse(raw) : {};
}

async function readForm(request) {
  const raw = await readBody(request);
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

function calculateSplit(totalCents) {
  const platformFeeCents = Math.floor(totalCents / 2);
  return { platformFeeCents, adminNetCents: totalCents - platformFeeCents };
}

function demoCookie(role, extra = "") {
  return [
    `cotarush_demo_role=${role}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`,
    extra,
  ].filter(Boolean).join(", ");
}

async function handleSignup(request, response) {
  const form = await readForm(request);
  const input = signupSchema.parse({
    ...form,
    termsAccepted: form.termsAccepted === "on" || form.termsAccepted === "true",
    privacyAccepted: form.privacyAccepted === "on" || form.privacyAccepted === "true",
  });

  if (!hasSupabaseEnv()) {
    if (!["A001", "J123"].includes(input.adminCode)) {
      return redirect(response, `${frontendOrigin}/cadastro?error=admin-code`);
    }

    return redirect(response, `${frontendOrigin}/conta`, {
      "set-cookie": demoCookie("participant", `cotarush_demo_admin_code=${input.adminCode}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`),
    });
  }

  const supabase = getSupabase();
  const { data: adminCode, error: adminCodeError } = await supabase
    .from("admin_invite_codes")
    .select("code, admin_id")
    .eq("code", input.adminCode)
    .eq("active", true)
    .single();

  if (adminCodeError || !adminCode) return redirect(response, `${frontendOrigin}/cadastro?error=admin-code`);

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
    user_metadata: {
      full_name: input.fullName,
      public_name: input.publicName,
      phone: input.phone,
      owner_admin_id: adminCode.admin_id,
      admin_code: input.adminCode,
    },
  });

  if (userError || !userData.user) return redirect(response, `${frontendOrigin}/cadastro?error=signup`);

  await supabase.from("profiles").upsert({
    id: userData.user.id,
    owner_admin_id: adminCode.admin_id,
    admin_code: input.adminCode,
    full_name: input.fullName,
    public_name: input.publicName,
    email: input.email,
    phone: input.phone,
  });
  await supabase.from("user_roles").upsert({ user_id: userData.user.id, role: "participant" });

  return redirect(response, `${frontendOrigin}/login`);
}

async function handleCreateOrder(request, response) {
  const input = orderSchema.parse(await readJson(request));
  if (!hasSupabaseEnv()) {
    const totalCents = input.quantity * 10;
    return json(response, 200, {
      orderId: `demo-${Date.now()}`,
      split: calculateSplit(totalCents),
    });
  }

  return json(response, 501, { error: "Use o proxy autenticado do frontend ou envie Bearer token no app mobile." });
}

async function handleAdminCampaign(request, response) {
  const input = campaignSchema.parse(await readJson(request));
  if (!hasSupabaseEnv()) return json(response, 200, { id: crypto.randomUUID(), status: "draft", input });
  return json(response, 501, { error: "Criacao direta exige contexto de ADM autenticado." });
}

async function handleAdminNumber(request, response, url) {
  if (!url.searchParams.get("number")) return json(response, 400, { error: "Numero obrigatorio." });
  return json(response, 200, { allocation: null, profile: null });
}

async function handleInstantPrize(request, response) {
  const input = instantPrizeControlSchema.parse(await readJson(request));
  if (!input.prizeId && !input.campaignId) return json(response, 400, { error: "Informe premio ou campanha." });
  return json(response, 200, { mode: hasSupabaseEnv() ? "backend" : "demo", result: input });
}

async function handleWebhook(request, response) {
  const payload = await readBody(request);
  return json(response, 200, { received: true, bytes: payload.length });
}

async function route(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `localhost:${port}`}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": frontendOrigin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,cookie",
    });
    return response.end();
  }

  try {
    if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true, service: "cotarush-backend" });
    if (request.method === "POST" && url.pathname === "/auth/signup") return await handleSignup(request, response);
    if (request.method === "POST" && url.pathname === "/orders") return await handleCreateOrder(request, response);
    if (request.method === "GET" && /^\/orders\/[^/]+$/.test(url.pathname)) return json(response, 200, { orderId: url.pathname.split("/").pop(), payment: null });
    if (request.method === "POST" && url.pathname === "/admin/campaigns") return await handleAdminCampaign(request, response);
    if (request.method === "GET" && url.pathname === "/admin/numbers") return await handleAdminNumber(request, response, url);
    if (request.method === "PATCH" && url.pathname === "/admin/instant-prizes") return await handleInstantPrize(request, response);
    if (request.method === "POST" && url.pathname === "/webhooks/mercadopago") return await handleWebhook(request, response);
    return json(response, 404, { error: "Rota nao encontrada." });
  } catch (error) {
    return json(response, 400, { error: error instanceof Error ? error.message : "Erro no backend." });
  }
}

http.createServer(route).listen(port, () => {
  console.log(`CotaRush backend rodando em http://localhost:${port}`);
});
