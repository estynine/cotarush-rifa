import type {
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

export const demoSocialLinks: SocialLinks = {
  whatsappGroup: "https://wa.me/5500000000000",
  whatsappSupport: "https://wa.me/5500000000000",
  instagram: "https://instagram.com/cotarush",
  tiktok: "https://tiktok.com/@cotarush",
  youtube: "https://youtube.com/@cotarush",
};

export const demoProfiles: Profile[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Marcos Silva",
    publicName: "Marcos",
    email: "marcos@example.com",
    phone: "11999990000",
    role: "participant",
    blocked: false,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    fullName: "Ana Souza",
    publicName: "Ana Turbo",
    email: "ana@example.com",
    phone: "21999990000",
    role: "participant",
    blocked: false,
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    fullName: "Admin CotaRush",
    publicName: "Operacao",
    email: "admin@cotarush.local",
    phone: "11900000000",
    role: "admin",
    blocked: false,
  },
];

export const demoCampaigns: Campaign[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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

export const demoInstantPrizes: InstantPrize[] = [
  {
    id: "p0",
    campaignId: demoCampaigns[0].id,
    number: 0,
    title: "Bonus relampago",
    prizeType: "money",
    valueCents: 5000,
    description: "Premio instantaneo de demonstracao.",
    active: true,
    found: true,
    foundByParticipantId: demoProfiles[0].id,
    foundOrderId: "order-demo-1",
    foundAt: "2026-07-25T13:20:00.000Z",
    deliveryStatus: "pending",
    releaseRule: "manual",
    payoutReserveCents: 5000,
    publicRuleLabel: "Liberado pela administracao da campanha",
  },
  {
    id: "p1",
    campaignId: demoCampaigns[0].id,
    number: 111111,
    title: "Combo energia",
    prizeType: "money",
    valueCents: 10000,
    description: "Premio configurado no ambiente de desenvolvimento.",
    active: true,
    found: false,
    deliveryStatus: "pending",
    releaseRule: "after_percent_sold",
    releaseThresholdPercent: 40,
    payoutReserveCents: 10000,
    publicRuleLabel: "Disponivel apos a campanha atingir 40% das cotas",
  },
  {
    id: "p2",
    campaignId: demoCampaigns[0].id,
    number: 222222,
    title: "Cotas extras",
    prizeType: "extra_numbers",
    extraNumbers: 1000,
    description: "Gera automaticamente cotas promocionais.",
    active: false,
    found: false,
    deliveryStatus: "pending",
    releaseRule: "manual",
    payoutReserveCents: 0,
    publicRuleLabel: "Aguardando liberacao da administracao",
  },
  {
    id: "p3",
    campaignId: demoCampaigns[0].id,
    number: 333333,
    title: "Mouse gamer",
    prizeType: "product",
    description: "Produto de demonstracao.",
    active: true,
    found: false,
    deliveryStatus: "pending",
    releaseRule: "sold_out",
    payoutReserveCents: 0,
    publicRuleLabel: "Disponivel somente apos todas as cotas serem vendidas",
  },
  {
    id: "p4",
    campaignId: demoCampaigns[0].id,
    number: 444444,
    title: "Premio turbo",
    prizeType: "money",
    valueCents: 30000,
    description: "Premio de demonstracao.",
    active: false,
    found: false,
    deliveryStatus: "pending",
    releaseRule: "after_revenue",
    releaseThresholdCents: 250000,
    payoutReserveCents: 30000,
    publicRuleLabel: "Disponivel apos reserva de caixa da campanha",
  },
];

export const demoOrders: Order[] = [
  {
    id: "order-demo-1",
    readableCode: "CR-20260725-0001",
    campaignId: demoCampaigns[0].id,
    participantId: demoProfiles[0].id,
    quantity: 1000,
    unitPriceCents: 10,
    totalCents: 10000,
    status: "approved",
    createdAt: "2026-07-25T13:10:00.000Z",
    approvedAt: "2026-07-25T13:20:00.000Z",
    processedAt: "2026-07-25T13:20:04.000Z",
  },
  {
    id: "order-demo-2",
    readableCode: "CR-20260725-0002",
    campaignId: demoCampaigns[0].id,
    participantId: demoProfiles[1].id,
    quantity: 2500,
    unitPriceCents: 10,
    totalCents: 25000,
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
