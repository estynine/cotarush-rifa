import type { InstantPrize, NumberAllocation, RankingEntry } from "./types";
import { MAX_CAMPAIGN_NUMBERS, MAX_ORDER_QUANTITY, toSaoPauloDateKey } from "./format";

export type AllocationInput = {
  campaignId: string;
  participantId: string;
  orderId: string;
  quantity: number;
  totalNumbers: number;
  existingNumbers: Set<number>;
  instantPrizes: Pick<InstantPrize, "number" | "active" | "found">[];
  random?: () => number;
  now?: Date;
};

export type AllocationResult = {
  allocations: NumberAllocation[];
  foundPrizeNumbers: number[];
  attempts: number;
};

export function isNumberAllowedForDistribution(
  number: number,
  instantPrizes: Pick<InstantPrize, "number" | "active" | "found">[],
): boolean {
  const prize = instantPrizes.find((item) => item.number === number);
  if (!prize) return true;
  return prize.active && !prize.found;
}

function assertCampaignNumber(value: number, totalNumbers: number): void {
  if (!Number.isInteger(value) || value < 0 || value >= totalNumbers || value >= MAX_CAMPAIGN_NUMBERS) {
    throw new RangeError("Numero fora do intervalo da campanha.");
  }
}

export function allocateRandomNumbers(input: AllocationInput): AllocationResult {
  if (!Number.isSafeInteger(input.totalNumbers) || input.totalNumbers <= 0 || input.totalNumbers > MAX_CAMPAIGN_NUMBERS) {
    throw new RangeError("Total de cotas da campanha invalido.");
  }

  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0 || input.quantity > input.totalNumbers || input.quantity > MAX_ORDER_QUANTITY) {
    throw new RangeError("Quantidade fora do intervalo permitido.");
  }

  for (const existingNumber of input.existingNumbers) {
    assertCampaignNumber(existingNumber, input.totalNumbers);
  }

  const prizeNumbers = new Set<number>();
  for (const prize of input.instantPrizes) {
    assertCampaignNumber(prize.number, input.totalNumbers);
    if (prizeNumbers.has(prize.number)) {
      throw new RangeError("Numero premiado duplicado na campanha.");
    }
    prizeNumbers.add(prize.number);
  }

  const reservedInactive = input.instantPrizes.filter((prize) => !prize.active || prize.found).length;
  const available = input.totalNumbers - input.existingNumbers.size - reservedInactive;
  if (input.quantity > available) {
    throw new RangeError("Nao ha cotas disponiveis suficientes.");
  }

  const random = input.random ?? Math.random;
  const now = input.now ?? new Date();
  const selected = new Set<number>();
  const foundPrizeNumbers: number[] = [];
  let attempts = 0;
  const maxAttempts = Math.max(input.quantity * 80, 5000);

  while (selected.size < input.quantity && attempts < maxAttempts) {
    attempts += 1;
    const candidate = Math.floor(random() * input.totalNumbers);
    if (input.existingNumbers.has(candidate) || selected.has(candidate)) continue;
    if (!isNumberAllowedForDistribution(candidate, input.instantPrizes)) continue;

    selected.add(candidate);
    const prize = input.instantPrizes.find((item) => item.number === candidate && item.active && !item.found);
    if (prize) foundPrizeNumbers.push(candidate);
  }

  if (selected.size < input.quantity) {
    for (let candidate = 0; candidate < input.totalNumbers && selected.size < input.quantity; candidate += 1) {
      if (input.existingNumbers.has(candidate) || selected.has(candidate)) continue;
      if (!isNumberAllowedForDistribution(candidate, input.instantPrizes)) continue;
      selected.add(candidate);
      const prize = input.instantPrizes.find((item) => item.number === candidate && item.active && !item.found);
      if (prize) foundPrizeNumbers.push(candidate);
    }
  }

  if (selected.size < input.quantity) {
    throw new RangeError("Nao foi possivel alocar cotas sem duplicidade.");
  }

  return {
    attempts,
    foundPrizeNumbers,
    allocations: Array.from(selected).map((number, index) => ({
      id: `${input.orderId}-${index}-${number}`,
      campaignId: input.campaignId,
      participantId: input.participantId,
      orderId: input.orderId,
      number,
      source: "purchase",
      awarded: foundPrizeNumbers.includes(number),
      allocationDate: now.toISOString(),
      status: "valid",
    })),
  };
}

export function applyDailyExtremes(
  allocations: Pick<NumberAllocation, "number" | "allocationDate">[],
  current: { lowestNumber?: number; highestNumber?: number } = {},
) {
  return allocations.reduce(
    (acc, allocation) => ({
      date: toSaoPauloDateKey(allocation.allocationDate),
      lowestNumber:
        acc.lowestNumber === undefined ? allocation.number : Math.min(acc.lowestNumber, allocation.number),
      highestNumber:
        acc.highestNumber === undefined ? allocation.number : Math.max(acc.highestNumber, allocation.number),
    }),
    {
      lowestNumber: current.lowestNumber,
      highestNumber: current.highestNumber,
      date: allocations[0] ? toSaoPauloDateKey(allocations[0].allocationDate) : toSaoPauloDateKey(new Date()),
    },
  );
}

export function buildRanking(
  purchases: { participantId: string; publicName: string; quantity: number; approvedAt: string }[],
  limit = 10,
): RankingEntry[] {
  const grouped = new Map<string, { publicName: string; quantity: number; lastPurchaseAt: string }>();

  for (const purchase of purchases) {
    const current = grouped.get(purchase.participantId);
    if (!current) {
      grouped.set(purchase.participantId, {
        publicName: purchase.publicName,
        quantity: purchase.quantity,
        lastPurchaseAt: purchase.approvedAt,
      });
      continue;
    }

    current.quantity += purchase.quantity;
    if (new Date(purchase.approvedAt) > new Date(current.lastPurchaseAt)) {
      current.lastPurchaseAt = purchase.approvedAt;
    }
  }

  const ordered = Array.from(grouped.entries())
    .map(([participantId, value]) => ({ participantId, ...value }))
    .sort((a, b) => b.quantity - a.quantity || a.publicName.localeCompare(b.publicName))
    .slice(0, limit);

  return ordered.map((entry, index, list) => ({
    ...entry,
    diffToPrevious: index === 0 ? 0 : list[index - 1].quantity - entry.quantity,
  }));
}

export class WebhookIdempotencyStore {
  private processed = new Set<string>();

  process(eventId: string, handler: () => void): "processed" | "duplicate" {
    if (this.processed.has(eventId)) return "duplicate";
    this.processed.add(eventId);
    handler();
    return "processed";
  }
}
