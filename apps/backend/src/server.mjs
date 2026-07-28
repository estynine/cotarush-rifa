import http from "node:http";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const port = Number(process.env.BACKEND_PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PLATFORM_FEE_BPS = 5000;
const ADMIN_NET_BPS = 5000;
const PLATFORM_SPLIT_RULE_VERSION = "platform_split_50_50_v1";

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
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    throw new RangeError("Valor total invalido para divisao da plataforma.");
  }

  const platformFeeCents = Math.floor(totalCents / 2);
  return {
    platformFeeCents,
    adminNetCents: totalCents - platformFeeCents,
    platformFeeBps: PLATFORM_FEE_BPS,
    adminNetBps: ADMIN_NET_BPS,
    ruleVersion: PLATFORM_SPLIT_RULE_VERSION,
  };
}

function demoCookie(role, extra = "") {
  return [
    `cotarush_demo_role=${role}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`,
    extra,
  ].filter(Boolean).join(", ");
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separatorIndex = item.indexOf("=");
        if (separatorIndex === -1) return [item, ""];
        return [item.slice(0, separatorIndex), item.slice(separatorIndex + 1)];
      }),
  );
}

function readSupabaseAccessTokenFromCookie(rawValue) {
  if (!rawValue) return undefined;
  let decoded = rawValue;
  try {
    decoded = decodeURIComponent(rawValue);
  } catch {
    decoded = rawValue;
  }

  const payload = decoded.startsWith("base64-")
    ? Buffer.from(decoded.slice("base64-".length), "base64url").toString("utf8")
    : decoded;

  try {
    const parsed = JSON.parse(payload);
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
    if (typeof parsed?.access_token === "string") return parsed.access_token;
  } catch {
    return undefined;
  }

  return undefined;
}

function extractAccessToken(request) {
  const authorization = request.headers.authorization ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (match?.[1]) return match[1];

  const cookies = parseCookies(request.headers.cookie);
  for (const [name, value] of Object.entries(cookies)) {
    if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
      const token = readSupabaseAccessTokenFromCookie(value);
      if (token) return token;
    }
  }

  const chunkedAuthCookie = Object.entries(cookies)
    .map(([name, value]) => {
      const matchChunk = name.match(/^(sb-.+-auth-token)\.(\d+)$/);
      return matchChunk ? { baseName: matchChunk[1], index: Number(matchChunk[2]), value } : null;
    })
    .filter(Boolean);

  if (chunkedAuthCookie.length > 0) {
    const baseName = chunkedAuthCookie[0].baseName;
    const rawValue = chunkedAuthCookie
      .filter((item) => item.baseName === baseName)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.value)
      .join("");
    const token = readSupabaseAccessTokenFromCookie(rawValue);
    if (token) return token;
  }

  return undefined;
}

async function getBackendUser(request, supabase) {
  const token = extractAccessToken(request);
  if (!token) throw new Error("AUTH_REQUIRED");

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) throw new Error("AUTH_REQUIRED");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, owner_admin_id, admin_code, user_roles(role)")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) throw new Error("AUTH_REQUIRED");

  const roles = Array.isArray(profile.user_roles) ? profile.user_roles : [];
  const role = roles.some((item) => item.role === "super_admin")
    ? "super_admin"
    : roles.some((item) => item.role === "admin")
      ? "admin"
      : "participant";

  return {
    id: authData.user.id,
    email: authData.user.email,
    role,
    ownerAdminId: profile.owner_admin_id,
    adminCode: profile.admin_code,
  };
}

function demoPixPayment(orderId, expiresAt) {
  return {
    orderId,
    expiresAt,
    copyPasteCode:
      "00020126580014br.gov.bcb.pix0136demo-cotarush-pix-chave52040000530398654041.005802BR5920CotaRush Demonstracao6009Sao Paulo62070503***6304DEMO",
    status: "pending",
  };
}

function verifyMercadoPagoSignature(request, body) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = request.headers["x-signature"] ?? "";
  const requestId = request.headers["x-request-id"] ?? "";
  const expected = createHmac("sha256", secret).update(`${requestId}.${body}`).digest("hex");
  return String(signature).includes(expected);
}

async function getMercadoPagoPayment(paymentId) {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) return null;

  const { MercadoPagoConfig, Payment } = await import("mercadopago");
  const client = new Payment(new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN }));
  return client.get({ id: paymentId });
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

  const supabase = getSupabase();
  const user = await getBackendUser(request, supabase);

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, owner_admin_id, name, price_per_number_cents, max_numbers_per_order, status")
    .eq("id", input.campaignId)
    .single();

  if (campaignError || !campaign || campaign.status !== "active") {
    return json(response, 400, { error: "Campanha indisponivel." });
  }

  if (user.role === "participant" && campaign.owner_admin_id !== user.ownerAdminId) {
    return json(response, 403, { error: "Campanha nao pertence ao ADM do participante." });
  }

  if (input.quantity > campaign.max_numbers_per_order) {
    return json(response, 400, { error: `Quantidade maxima por pedido: ${campaign.max_numbers_per_order}.` });
  }

  const { data: paymentAccount, error: paymentAccountError } = await supabase
    .from("admin_payment_accounts")
    .select("admin_id, provider, account_reference, active")
    .eq("admin_id", campaign.owner_admin_id)
    .eq("active", true)
    .single();

  if (paymentAccountError || !paymentAccount) {
    return json(response, 400, { error: "Conta de recebimento do ADM nao configurada." });
  }

  const totalCents = campaign.price_per_number_cents * input.quantity;
  const split = calculateSplit(totalCents);
  const readableCode = `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      campaign_id: input.campaignId,
      owner_admin_id: campaign.owner_admin_id,
      participant_id: user.id,
      readable_code: readableCode,
      quantity: input.quantity,
      unit_price_cents: campaign.price_per_number_cents,
      total_cents: totalCents,
      platform_fee_cents: split.platformFeeCents,
      admin_net_cents: split.adminNetCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) throw orderError;

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const pix = demoPixPayment(order.id, expiresAt);
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      order_id: order.id,
      provider: paymentAccount.provider,
      status: pix.status,
      amount_cents: totalCents,
      platform_fee_cents: split.platformFeeCents,
      admin_net_cents: split.adminNetCents,
      pix_copy_paste: pix.copyPasteCode,
      expires_at: pix.expiresAt,
    })
    .select("id")
    .single();

  if (paymentError || !payment) throw paymentError;

  const { error: revenueSplitError } = await supabase.from("order_revenue_splits").insert({
    order_id: order.id,
    owner_admin_id: campaign.owner_admin_id,
    admin_payment_account_id: paymentAccount.admin_id,
    platform_fee_cents: split.platformFeeCents,
    admin_net_cents: split.adminNetCents,
    platform_fee_bps: split.platformFeeBps,
    admin_net_bps: split.adminNetBps,
    split_rule_version: split.ruleVersion,
    status: "pending",
  });

  if (revenueSplitError) throw revenueSplitError;

  const { error: splitInstructionError } = await supabase.from("payment_split_instructions").insert({
    order_id: order.id,
    payment_id: payment.id,
    owner_admin_id: campaign.owner_admin_id,
    admin_payment_account_id: paymentAccount.admin_id,
    split_rule_version: split.ruleVersion,
    platform_fee_bps: split.platformFeeBps,
    admin_net_bps: split.adminNetBps,
    gross_amount_cents: totalCents,
    platform_fee_cents: split.platformFeeCents,
    admin_net_cents: split.adminNetCents,
    provider: paymentAccount.provider,
    admin_destination_reference: paymentAccount.account_reference,
    status: "pending_payment",
  });

  if (splitInstructionError) throw splitInstructionError;

  return json(response, 200, { orderId: order.id, split });
}

async function handleGetOrder(request, response, orderId) {
  if (!hasSupabaseEnv()) {
    return json(response, 200, {
      orderId,
      payment: demoPixPayment(orderId, new Date(Date.now() + 30 * 60 * 1000).toISOString()),
    });
  }

  const supabase = getSupabase();
  const user = await getBackendUser(request, supabase);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, participant_id, owner_admin_id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) return json(response, 404, { error: "Pedido nao encontrado." });
  if (user.role === "participant" && order.participant_id !== user.id) {
    return json(response, 403, { error: "Pedido nao pertence ao participante." });
  }
  if (user.role === "admin" && order.owner_admin_id !== user.id) {
    return json(response, 403, { error: "Pedido nao pertence ao ADM." });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("status, pix_copy_paste, pix_qr_code_base64, expires_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError) throw paymentError;

  return json(response, 200, {
    orderId: order.id,
    payment: payment
      ? {
          orderId: order.id,
          status: payment.status,
          qrCodeBase64: payment.pix_qr_code_base64,
          copyPasteCode: payment.pix_copy_paste,
          expiresAt: payment.expires_at,
        }
      : null,
  });
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
  const rawBody = await readBody(request);
  if (!verifyMercadoPagoSignature(request, rawBody)) {
    return json(response, 401, { error: "Assinatura invalida." });
  }

  const payload = JSON.parse(rawBody || "{}");
  const eventId = payload.id ?? `${payload.action}-${payload.data?.id}`;
  if (!eventId) return json(response, 400, { error: "Evento sem id." });

  if (!hasSupabaseEnv()) {
    return json(response, 200, { status: "processed-demo", eventId });
  }

  const supabase = getSupabase();
  const { error: eventError } = await supabase.from("payment_events").insert({
    provider: "mercado_pago",
    provider_event_id: eventId,
    event_type: payload.type ?? payload.action ?? "unknown",
    raw_payload: payload,
    processed_at: null,
  });

  if (eventError?.code === "23505") {
    return json(response, 200, { status: "duplicate" });
  }

  if (eventError) throw eventError;

  if (payload.type === "payment" && payload.data?.id) {
    const payment = await getMercadoPagoPayment(payload.data.id);
    const status = payment?.status === "approved" ? "approved" : payment?.status === "refunded" ? "refunded" : "pending";
    const orderId = payment?.external_reference ?? payload.external_reference;

    if (orderId) {
      await supabase.rpc("process_payment_status", {
        p_order_id: orderId,
        p_provider_payment_id: String(payment?.id ?? payload.data.id),
        p_status: status,
        p_raw_payload: payment ?? payload,
      });
    }
  }

  await supabase
    .from("payment_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider_event_id", eventId);

  return json(response, 200, { status: "processed" });
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
    if (request.method === "GET" && /^\/orders\/[^/]+$/.test(url.pathname)) return await handleGetOrder(request, response, url.pathname.split("/").pop());
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
