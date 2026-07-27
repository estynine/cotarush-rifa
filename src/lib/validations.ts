import { z } from "zod";
import { MAX_ORDER_QUANTITY, normalizePhone } from "./format";

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .regex(/[A-Z]/, "Inclua uma letra maiuscula.")
  .regex(/[a-z]/, "Inclua uma letra minuscula.")
  .regex(/[0-9]/, "Inclua um numero.");

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo."),
    publicName: z.string().trim().min(2, "Informe seu nome publico."),
    email: z.email("Informe um e-mail valido.").toLowerCase(),
    phone: z.string().transform(normalizePhone).pipe(z.string().min(10).max(13)),
    adminCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z][0-9]{3}$/, "Codigo do ADM deve ter 1 letra e 3 numeros. Exemplo: A001."),
    password: passwordSchema,
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, "Aceite os Termos de Uso."),
    privacyAccepted: z.literal(true, "Aceite a Politica de Privacidade."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao conferem.",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.email("Informe um e-mail valido.").toLowerCase(),
  password: z.string().min(1, "Informe sua senha."),
});

export const quantitySchema = z.object({
  campaignId: z.uuid(),
  quantity: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_ORDER_QUANTITY, "O limite padrao por pedido e 10.000 cotas."),
});

export const createOrderSchema = z.object({
  campaignId: z.uuid(),
  quantity: z.coerce.number().int().positive().max(MAX_ORDER_QUANTITY, "O limite por pedido e 10.000 cotas."),
  pendingPurchaseToken: z.string().optional(),
});

export const campaignSchema = z.object({
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

const instantPrizeReleaseRuleSchema = z.enum(["manual", "after_percent_sold", "after_revenue", "sold_out"]);

const instantPrizeControlBaseSchema = z
  .object({
    active: z.boolean().optional(),
    valueCents: z.number().int().nonnegative().nullable().optional(),
    payoutReserveCents: z.number().int().nonnegative().optional(),
    releaseRule: instantPrizeReleaseRuleSchema.optional(),
    releaseThresholdPercent: z.number().min(0).max(100).nullable().optional(),
    releaseThresholdCents: z.number().int().nonnegative().nullable().optional(),
    publicRuleLabel: z.string().trim().min(3).max(180).optional(),
    reason: z.string().trim().min(3).max(400).optional(),
  })
  .superRefine((data, context) => {
    if (data.releaseRule === "manual" || data.releaseRule === "sold_out") {
      if (data.releaseThresholdPercent != null || data.releaseThresholdCents != null) {
        context.addIssue({ code: "custom", message: "Esta regra nao aceita gatilho numerico.", path: ["releaseRule"] });
      }
    }

    if (data.releaseRule === "after_percent_sold") {
      if (data.releaseThresholdPercent == null || data.releaseThresholdCents != null) {
        context.addIssue({ code: "custom", message: "Informe apenas o percentual vendido.", path: ["releaseThresholdPercent"] });
      }
    }

    if (data.releaseRule === "after_revenue") {
      if (data.releaseThresholdCents == null || data.releaseThresholdPercent != null) {
        context.addIssue({ code: "custom", message: "Informe apenas o caixa em centavos.", path: ["releaseThresholdCents"] });
      }
    }
  });

export const instantPrizeControlSchema = instantPrizeControlBaseSchema
  .extend({
    prizeId: z.string().trim().min(1),
  })
  .refine(({ active, valueCents, payoutReserveCents, releaseRule, publicRuleLabel }) => active !== undefined || valueCents !== undefined || payoutReserveCents !== undefined || releaseRule !== undefined || publicRuleLabel !== undefined, {
    message: "Informe pelo menos uma alteracao.",
  });

export const instantPrizeBatchControlSchema = instantPrizeControlBaseSchema
  .extend({
    campaignId: z.uuid(),
  })
  .refine(({ active, valueCents, payoutReserveCents, releaseRule, publicRuleLabel }) => active !== undefined || valueCents !== undefined || payoutReserveCents !== undefined || releaseRule !== undefined || publicRuleLabel !== undefined, {
    message: "Informe pelo menos uma alteracao em lote.",
  });

export function validateQuantityAgainstCampaign(quantity: number, maxPerOrder: number): void {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new RangeError("Quantidade invalida.");
  }

  if (!Number.isSafeInteger(maxPerOrder) || maxPerOrder <= 0 || maxPerOrder > MAX_ORDER_QUANTITY) {
    throw new RangeError("Limite da campanha invalido.");
  }

  if (quantity > maxPerOrder || quantity > MAX_ORDER_QUANTITY) {
    throw new RangeError(`Quantidade maxima por pedido: ${Math.min(maxPerOrder, MAX_ORDER_QUANTITY)}.`);
  }
}
