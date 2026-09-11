import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const rows = await prisma.ebook.findMany({
  select: { slug: true, title: true, status: true, isFree: true, priceNpr: true },
  orderBy: { slug: "asc" },
});
console.log(JSON.stringify(rows, null, 2));

try {
  const one = await prisma.ebook.findUnique({
    where: { slug: "money-mindset-workbook" },
    select: {
      slug: true,
      status: true,
      headline: true,
      curriculumJson: true,
      communityOfferEnabled: true,
    },
  });
  console.log("detail select ok", one);
} catch (error) {
  console.error("detail select failed", error);
}

await prisma.$disconnect();
