import { describe, expect, it } from "vitest";
import {
  calculateOrderTotal,
  formatCurrency,
  formatNumber,
  parseFormattedNumber,
  toSaoPauloDateKey,
} from "./format";
import { validateQuantityAgainstCampaign } from "./validations";

describe("formatacao brasileira", () => {
  it("formata numeros com seis digitos e ponto", () => {
    expect(formatNumber(0)).toBe("000.000");
    expect(formatNumber(728)).toBe("000.728");
    expect(formatNumber(111111)).toBe("111.111");
    expect(formatNumber(999999)).toBe("999.999");
  });

  it("parseia numeros digitados pelo operador", () => {
    expect(parseFormattedNumber("000.728")).toBe(728);
    expect(parseFormattedNumber("999999")).toBe(999999);
  });

  it("calcula valores no servidor", () => {
    expect(calculateOrderTotal(10, 1000)).toBe(10000);
    expect(formatCurrency(10000)).toBe("R$ 100,00");
  });

  it("valida limite maximo por pedido", () => {
    expect(() => validateQuantityAgainstCampaign(10001, 10000)).toThrow("Quantidade maxima");
    expect(() => validateQuantityAgainstCampaign(10000, 10000)).not.toThrow();
  });

  it("usa data de Sao Paulo para fechamento diario", () => {
    expect(toSaoPauloDateKey("2026-07-26T02:59:59.000Z")).toBe("2026-07-25");
    expect(toSaoPauloDateKey("2026-07-26T03:00:00.000Z")).toBe("2026-07-26");
  });
});
