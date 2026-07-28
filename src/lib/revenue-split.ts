export const PLATFORM_FEE_BPS = 5000;
export const ADMIN_NET_BPS = 5000;
export const PLATFORM_SPLIT_RULE_VERSION = "platform_split_50_50_v1";

export type PlatformSplit = {
  platformFeeCents: number;
  adminNetCents: number;
  platformFeeBps: typeof PLATFORM_FEE_BPS;
  adminNetBps: typeof ADMIN_NET_BPS;
  ruleVersion: typeof PLATFORM_SPLIT_RULE_VERSION;
};

export function calculatePlatformSplit(totalCents: number): PlatformSplit {
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
