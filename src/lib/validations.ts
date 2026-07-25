import { z } from "zod";
import { normalizePhone } from "./format";

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
    .max(10000, "O limite padrao por pedido e 10.000 cotas."),
});

export const createOrderSchema = z.object({
  campaignId: z.uuid(),
  quantity: z.coerce.number().int().positive(),
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

export function validateQuantityAgainstCampaign(quantity: number, maxPerOrder: number): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new RangeError("Quantidade invalida.");
  }

  if (quantity > maxPerOrder) {
    throw new RangeError(`Quantidade maxima por pedido: ${maxPerOrder}.`);
  }
}
