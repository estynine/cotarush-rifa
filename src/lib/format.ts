export const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
export const MAX_ORDER_QUANTITY = 10000;
export const MAX_CAMPAIGN_NUMBERS = 1000000;

function assertPositiveInteger(value: number, message: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(message);
  }
}

export function formatNumber(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 999999) {
    throw new RangeError("O numero precisa estar entre 0 e 999999.");
  }

  const sixDigits = value.toString().padStart(6, "0");
  return `${sixDigits.slice(0, 3)}.${sixDigits.slice(3)}`;
}

export function parseFormattedNumber(value: string): number {
  const normalized = value.replace(/\D/g, "");
  if (!/^\d{1,6}$/.test(normalized)) {
    throw new RangeError("Numero invalido.");
  }

  return Number(normalized);
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
    .format(cents / 100)
    .replace(/\u00a0/g, " ");
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: SAO_PAULO_TIME_ZONE,
  }).format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: SAO_PAULO_TIME_ZONE,
  }).format(new Date(value));
}

export function toSaoPauloDateKey(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function calculateOrderTotal(unitPriceCents: number, quantity: number): number {
  assertPositiveInteger(unitPriceCents, "Valor da cota invalido.");
  assertPositiveInteger(quantity, "Quantidade invalida.");

  if (quantity > MAX_ORDER_QUANTITY) {
    throw new RangeError(`Quantidade maxima por pedido: ${MAX_ORDER_QUANTITY}.`);
  }

  const total = unitPriceCents * quantity;
  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new RangeError("Total do pedido invalido.");
  }

  return total;
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskPublicName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 2) return trimmed;
  return `${trimmed.slice(0, 2)}***`;
}
