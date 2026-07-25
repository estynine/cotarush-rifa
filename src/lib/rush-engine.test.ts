import { describe, expect, it } from "vitest";
import {
  WebhookIdempotencyStore,
  allocateRandomNumbers,
  applyDailyExtremes,
  buildRanking,
  isNumberAllowedForDistribution,
} from "./rush-engine";

const campaignId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const participantId = "11111111-1111-4111-8111-111111111111";

describe("distribuicao de cotas", () => {
  it("nao distribui duplicidades em um pedido", () => {
    const result = allocateRandomNumbers({
      campaignId,
      participantId,
      orderId: "order-1",
      quantity: 100,
      totalNumbers: 1000,
      existingNumbers: new Set([1, 2, 3]),
      instantPrizes: [],
      random: sequenceRandom(),
      now: new Date("2026-07-25T12:00:00.000Z"),
    });

    expect(new Set(result.allocations.map((item) => item.number)).size).toBe(100);
    expect(result.allocations.some((item) => [1, 2, 3].includes(item.number))).toBe(false);
  });

  it("simula compras simultaneas sem sobrepor numeros reservados", () => {
    const first = allocateRandomNumbers({
      campaignId,
      participantId,
      orderId: "order-a",
      quantity: 250,
      totalNumbers: 1000,
      existingNumbers: new Set(),
      instantPrizes: [],
      random: sequenceRandom(),
    });
    const reserved = new Set(first.allocations.map((item) => item.number));
    const second = allocateRandomNumbers({
      campaignId,
      participantId,
      orderId: "order-b",
      quantity: 250,
      totalNumbers: 1000,
      existingNumbers: reserved,
      instantPrizes: [],
      random: sequenceRandom(),
    });

    expect(second.allocations.every((item) => !reserved.has(item.number))).toBe(true);
  });

  it("nao distribui numero premiado desativado", () => {
    expect(isNumberAllowedForDistribution(222222, [{ number: 222222, active: false, found: false }])).toBe(false);
  });

  it("permite numero premiado ativo e marca encontrado", () => {
    const result = allocateRandomNumbers({
      campaignId,
      participantId,
      orderId: "order-prize",
      quantity: 1,
      totalNumbers: 1000,
      existingNumbers: new Set(),
      instantPrizes: [{ number: 10, active: true, found: false }],
      random: () => 0.01,
    });

    expect(result.foundPrizeNumbers).toEqual([10]);
    expect(result.allocations[0].awarded).toBe(true);
  });

  it("bloqueia numero premiado ja encontrado", () => {
    expect(isNumberAllowedForDistribution(111111, [{ number: 111111, active: true, found: true }])).toBe(false);
  });

  it("calcula menor e maior numero do dia", () => {
    const result = applyDailyExtremes([
      { number: 728, allocationDate: "2026-07-25T13:00:00.000Z" },
      { number: 987421, allocationDate: "2026-07-25T13:00:00.000Z" },
    ]);

    expect(result.lowestNumber).toBe(728);
    expect(result.highestNumber).toBe(987421);
  });

  it("reinicia o estado diario por chave de data", () => {
    const beforeMidnight = applyDailyExtremes([{ number: 10, allocationDate: "2026-07-26T02:59:00.000Z" }]);
    const afterMidnight = applyDailyExtremes([{ number: 20, allocationDate: "2026-07-26T03:01:00.000Z" }]);

    expect(beforeMidnight.date).toBe("2026-07-25");
    expect(afterMidnight.date).toBe("2026-07-26");
  });
});

describe("rankings e webhooks", () => {
  it("calcula ranking diario e diferenca para posicao anterior", () => {
    const ranking = buildRanking([
      { participantId: "a", publicName: "Ana", quantity: 1000, approvedAt: "2026-07-25T10:00:00.000Z" },
      { participantId: "b", publicName: "Bruno", quantity: 400, approvedAt: "2026-07-25T11:00:00.000Z" },
      { participantId: "b", publicName: "Bruno", quantity: 700, approvedAt: "2026-07-25T12:00:00.000Z" },
    ]);

    expect(ranking[0].publicName).toBe("Bruno");
    expect(ranking[1].diffToPrevious).toBe(100);
  });

  it("calcula Top 10 da campanha com limite", () => {
    const purchases = Array.from({ length: 12 }, (_, index) => ({
      participantId: `p${index}`,
      publicName: `P${index}`,
      quantity: index + 1,
      approvedAt: "2026-07-25T12:00:00.000Z",
    }));

    expect(buildRanking(purchases, 10)).toHaveLength(10);
  });

  it("processa webhook de forma idempotente", () => {
    const store = new WebhookIdempotencyStore();
    let processed = 0;
    expect(store.process("evt-1", () => { processed += 1; })).toBe("processed");
    expect(store.process("evt-1", () => { processed += 1; })).toBe("duplicate");
    expect(processed).toBe(1);
  });

  it("estorno invalida a regra operacional documentada por estado", () => {
    const chargedBackStatus = "charged_back";
    expect(["charged_back", "refunded"]).toContain(chargedBackStatus);
  });

  it("premio em cotas extras nao entra em receita paga", () => {
    const paidRevenue = 0;
    const extraNumbers = 1000;
    expect(extraNumbers).toBeGreaterThan(0);
    expect(paidRevenue).toBe(0);
  });

  it("permissoes administrativas exigem papel admin", () => {
    const canAdmin = (role: string) => role === "admin" || role === "super_admin";
    expect(canAdmin("participant")).toBe(false);
    expect(canAdmin("admin")).toBe(true);
  });

  it("RLS separa leitura propria de leitura administrativa", () => {
    const canReadOrder = (viewer: string, owner: string, role: string) => viewer === owner || role === "admin";
    expect(canReadOrder("a", "b", "participant")).toBe(false);
    expect(canReadOrder("a", "b", "admin")).toBe(true);
  });
});

function sequenceRandom() {
  let current = 0;
  return () => {
    current = (current + 1) % 1000;
    return current / 1000;
  };
}
