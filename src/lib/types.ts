export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "sold_out"
  | "awaiting_draw"
  | "drawn"
  | "finished"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "in_review"
  | "expired"
  | "cancelled"
  | "charged_back"
  | "refunded";

export type PrizeAwardStatus =
  | "pending"
  | "validating"
  | "validated"
  | "awaiting_payment"
  | "paid"
  | "delivered"
  | "refused"
  | "cancelled";

export type PrizeType = "money" | "product" | "extra_numbers" | "credit" | "other";
export type InstantPrizeReleaseRule = "manual" | "after_percent_sold" | "after_revenue" | "sold_out";

export type Campaign = {
  id: string;
  ownerAdminId: string;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  fullDescription: string;
  prizeType: PrizeType;
  estimatedValueCents: number;
  pricePerNumberCents: number;
  totalNumbers: number;
  maxNumbersPerOrder: number;
  startsAt: string;
  endsAt: string;
  drawAt: string;
  status: CampaignStatus;
  mainImage: string;
  gallery: string[];
  regulation: string;
  confirmedNumbers: number;
  socialLinks?: SocialLinks;
  dailyPrize: {
    lowestEnabled: boolean;
    highestEnabled: boolean;
    lowestValueCents: number;
    highestValueCents: number;
    countExtraNumbers: boolean;
  };
};

export type Profile = {
  id: string;
  ownerAdminId?: string;
  inviteCode?: string;
  fullName: string;
  publicName: string;
  email: string;
  phone: string;
  role: "participant" | "admin" | "super_admin";
  blocked: boolean;
};

export type Order = {
  id: string;
  ownerAdminId: string;
  readableCode: string;
  campaignId: string;
  participantId: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  platformFeeCents: number;
  adminNetCents: number;
  status: PaymentStatus;
  createdAt: string;
  approvedAt?: string;
  processedAt?: string;
};

export type NumberAllocation = {
  id: string;
  campaignId: string;
  participantId: string;
  orderId: string;
  number: number;
  source: "purchase" | "prize_grant";
  awarded: boolean;
  allocationDate: string;
  status: "valid" | "invalidated";
};

export type InstantPrize = {
  id: string;
  campaignId: string;
  number: number;
  title: string;
  prizeType: PrizeType;
  valueCents?: number;
  extraNumbers?: number;
  description: string;
  imageUrl?: string;
  active: boolean;
  found: boolean;
  foundByParticipantId?: string;
  foundOrderId?: string;
  activatedAt?: string;
  foundAt?: string;
  deliveryStatus: PrizeAwardStatus;
  releaseRule: InstantPrizeReleaseRule;
  releaseThresholdPercent?: number;
  releaseThresholdCents?: number;
  payoutReserveCents: number;
  publicRuleLabel: string;
};

export type PrizeAward = {
  id: string;
  participantId: string;
  campaignId: string;
  category: "main_draw" | "instant" | "daily_lowest" | "daily_highest" | "extra";
  number?: number;
  valueCents?: number;
  description: string;
  validationCode: string;
  status: PrizeAwardStatus;
  createdAt: string;
};

export type RankingEntry = {
  participantId: string;
  publicName: string;
  quantity: number;
  lastPurchaseAt?: string;
  diffToPrevious: number;
};

export type DailyExtremes = {
  date: string;
  lowestNumber?: number;
  lowestOwner?: string;
  highestNumber?: number;
  highestOwner?: string;
  updatedAt?: string;
};

export type SocialLinks = {
  whatsappGroup?: string;
  whatsappSupport?: string;
  supportEnabled?: boolean;
  supportLabel?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
};

export type AdminTenant = {
  id: string;
  publicName: string;
  inviteCode: string;
  paymentAccountLabel?: string;
};

export type PixPayment = {
  orderId: string;
  expiresAt: string;
  qrCodeBase64?: string;
  copyPasteCode: string;
  status: PaymentStatus;
};
