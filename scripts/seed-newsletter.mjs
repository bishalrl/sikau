import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const env = readFileSync(".env", "utf8").replace(/^\uFEFF/, "");
const match = env.match(/^\s*DATABASE_URL\s*=\s*(.*)$/m);
const connectionString = match?.[1]?.trim().replace(/^['"]|['"]$/g, "").replace(/\r$/, "");
if (!connectionString) throw new Error("DATABASE_URL missing");

const host = connectionString.replace(/^.*@/, "").replace(/\/.*$/, "");
console.log("Using database host", host);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const permissions = JSON.stringify({ text: "ADMIN", media: "ADMIN", voice: "ADMIN" });

const community = await prisma.community.upsert({
  where: { slug: "newsletter-updates" },
  update: {
    name: "NEPSE Weekly",
    description: "Weekly market research + live session — members can read only.",
    permissions,
    status: "ACTIVE",
  },
  create: {
    slug: "newsletter-updates",
    name: "NEPSE Weekly",
    description: "Weekly market research + live session — members can read only.",
    permissions,
    status: "ACTIVE",
  },
});

let product = await prisma.newsletterProduct.findFirst({
  where: { communityId: community.id },
});

if (!product) {
  product = await prisma.newsletterProduct.create({
    data: {
      title: "NEPSE Weekly",
      description: "Weekly market research + 1-hour live session for Nepali investors.",
      priceNpr: 999,
      paymentInstructions: "Scan the QR, pay, then upload your receipt for unlock.",
      isActive: true,
      communityId: community.id,
    },
  });
}

const defaults = [
  {
    code: "MONTHLY",
    label: "Monthly",
    priceNpr: 999,
    listPriceNpr: null,
    discountPercent: null,
    perDayNpr: 33,
    badge: null,
    sortOrder: 1,
  },
  {
    code: "QUARTERLY",
    label: "Quarterly",
    priceNpr: 2499,
    listPriceNpr: 2997,
    discountPercent: 17,
    perDayNpr: 28,
    badge: "MOST_POPULAR",
    sortOrder: 2,
  },
  {
    code: "YEARLY",
    label: "Yearly",
    priceNpr: 7999,
    listPriceNpr: 11988,
    discountPercent: 33,
    perDayNpr: 22,
    badge: "BEST_VALUE",
    sortOrder: 3,
  },
];

for (const plan of defaults) {
  await prisma.newsletterPlan.upsert({
    where: { productId_code: { productId: product.id, code: plan.code } },
    update: { isActive: true },
    create: { productId: product.id, ...plan, isActive: true },
  });
}

console.log("Newsletter ready:", product.id);
await prisma.$disconnect();
