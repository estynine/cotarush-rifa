import type {
  AdminTenant,
  Campaign,
  DailyExtremes,
  InstantPrize,
  NumberAllocation,
  Order,
  PrizeAward,
  Profile,
  RankingEntry,
  SocialLinks,
} from "./types";

export const demoAdminTenants: AdminTenant[] = [
  {
    id: "99999999-9999-4999-8999-999999999999",
    publicName: "Operacao",
    inviteCode: "A001",
    paymentAccountLabel: "Conta ADM Operacao",
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    publicName: "Joao",
    inviteCode: "J123",
    paymentAccountLabel: "Conta ADM Joao",
  },
];

export const demoSocialLinks: SocialLinks = {
  whatsappGroup: "https://wa.me/5500000000000",
  whatsappSupport: "https://wa.me/5500000000000",
  supportEnabled: true,
  supportLabel: "Suporte via WhatsApp",
  instagram: "https://instagram.com/cotarush",
  tiktok: "https://tiktok.com/@cotarush",
  youtube: "https://youtube.com/@cotarush",
  telegram: "https://t.me/cotarush",
};

export const demoProfiles: Profile[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    ownerAdminId: demoAdminTenants[0].id,
    inviteCode: demoAdminTenants[0].inviteCode,
    fullName: "Marcos Silva",
    publicName: "Marcos",
    email: "marcos@example.com",
    phone: "11999990000",
    role: "participant",
    blocked: false,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    ownerAdminId: demoAdminTenants[0].id,
    inviteCode: demoAdminTenants[0].inviteCode,
    fullName: "Ana Souza",
    publicName: "Ana Turbo",
    email: "ana@example.com",
    phone: "21999990000",
    role: "participant",
    blocked: false,
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    inviteCode: demoAdminTenants[0].inviteCode,
    fullName: "Admin CotaRush",
    publicName: "Operacao",
    email: "admin@cotarush.local",
    phone: "11900000000",
    role: "admin",
    blocked: false,
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    inviteCode: demoAdminTenants[1].inviteCode,
    fullName: "Joao Administrador",
    publicName: "Joao",
    email: "joao@cotarush.local",
    phone: "11911110000",
    role: "admin",
    blocked: false,
  },
];

export const demoCampaigns: Campaign[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ownerAdminId: demoAdminTenants[0].id,
    slug: "setup-gamer-dos-sonhos",
    name: "Setup Gamer dos Sonhos",
    title: "Setup Gamer dos Sonhos",
    subtitle: "PC Gamer Completo",
    shortDescription:
      "Campanha premiada com PC gamer completo, premios instantaneos e ranking diario.",
    fullDescription:
      "Participe da campanha premiada Setup Gamer dos Sonhos. Escolha suas cotas, pague por Pix e receba seus numeros apos a confirmacao oficial do pagamento.",
    prizeType: "product",
    estimatedValueCents: 850000,
    pricePerNumberCents: 10,
    totalNumbers: 1000000,
    maxNumbersPerOrder: 10000,
    startsAt: "2026-07-25T03:00:00.000Z",
    endsAt: "2026-08-25T02:59:59.000Z",
    drawAt: "2026-08-26T00:00:00.000Z",
    status: "active",
    mainImage: "/campaign-setup.svg",
    gallery: ["/campaign-setup.svg"],
    regulation:
      "Resultado final definido pela fonte de apuracao registrada no painel administrativo. Pagamentos aprovados geram cotas de forma aleatoria e transacional.",
    confirmedNumbers: 184720,
    socialLinks: demoSocialLinks,
    dailyPrize: {
      lowestEnabled: true,
      highestEnabled: true,
      lowestValueCents: 5000,
      highestValueCents: 5000,
      countExtraNumbers: false,
    },
  },
];

export const demoInstantPrizes: InstantPrize[] = [];

export const demoOrders: Order[] = [
  {
    id: "order-demo-1",
    ownerAdminId: demoAdminTenants[0].id,
    readableCode: "CR-20260725-0001",
    campaignId: demoCampaigns[0].id,
    participantId: demoProfiles[0].id,
    quantity: 1000,
    unitPriceCents: 10,
    totalCents: 10000,
    platformFeeCents: 5000,
    adminNetCents: 5000,
    status: "approved",
    createdAt: "2026-07-25T13:10:00.000Z",
    approvedAt: "2026-07-25T13:20:00.000Z",
    processedAt: "2026-07-25T13:20:04.000Z",
  },
  {
    id: "order-demo-2",
    ownerAdminId: demoAdminTenants[0].id,
    readableCode: "CR-20260725-0002",
    campaignId: demoCampaigns[0].id,
    participantId: demoProfiles[1].id,
    quantity: 2500,
    unitPriceCents: 10,
    totalCents: 25000,
    platformFeeCents: 12500,
    adminNetCents: 12500,
    status: "approved",
    createdAt: "2026-07-25T14:00:00.000Z",
    approvedAt: "2026-07-25T14:04:00.000Z",
    processedAt: "2026-07-25T14:04:03.000Z",
  },
];

export const demoAllocations: NumberAllocation[] = [
  {
    id: "a1",
    campaignId: demoCampaigns[0].id,
    participantId: demoProfiles[0].id,
    orderId: "order-demo-1",
    number: 0,
    source: "purchase",
    awarded: true,
    allocationDate: "2026-07-25T13:20:04.000Z",
    status: "valid",
  },
  {
    id: "a2",
    campaignId: demoCampaigns[0].id,
    participantId: demoProfiles[0].id,
    orderId: "order-demo-1",
    number: 728,
    source: "purchase",
    awarded: false,
    allocationDate: "2026-07-25T13:20:04.000Z",
    status: "valid",
  },
  {
    id: "a3",
    campaignId: demoCampaigns[0].id,
    participantId: demoProfiles[1].id,
    orderId: "order-demo-2",
    number: 987421,
    source: "purchase",
    awarded: false,
    allocationDate: "2026-07-25T14:04:03.000Z",
    status: "valid",
  },
];

export const demoDailyRanking: RankingEntry[] = [
  {
    participantId: demoProfiles[1].id,
    publicName: "Ana Turbo",
    quantity: 2500,
    lastPurchaseAt: "2026-07-25T14:04:00.000Z",
    diffToPrevious: 0,
  },
  {
    participantId: demoProfiles[0].id,
    publicName: "Marcos",
    quantity: 1000,
    lastPurchaseAt: "2026-07-25T13:20:00.000Z",
    diffToPrevious: 1500,
  },
];

export const demoCampaignTopTen = demoDailyRanking;

export const demoDailyExtremes: DailyExtremes = {
  date: "2026-07-25",
  lowestNumber: 728,
  lowestOwner: "Marcos",
  highestNumber: 987421,
  highestOwner: "Ana Turbo",
  updatedAt: "2026-07-25T14:04:03.000Z",
};

export const demoAwards: PrizeAward[] = [
  {
    id: "award-demo-1",
    participantId: demoProfiles[0].id,
    campaignId: demoCampaigns[0].id,
    category: "instant",
    number: 0,
    valueCents: 5000,
    description: "Bonus relampago",
    validationCode: "CR-VAL-000000",
    status: "pending",
    createdAt: "2026-07-25T13:20:05.000Z",
  },
];

export function findCampaignBySlug(slug: string): Campaign | undefined {
  return demoCampaigns.find((campaign) => campaign.slug === slug);
}
