import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const PDF = "/rajuimageandqr/e-book.pdf";
const QR = "/rajuimageandqr/bankqr.jpeg";
const COVER = "/rajuimageandqr/ebook-cover.jpeg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const result = await prisma.ebook.updateMany({
  data: {
    filePath: PDF,
    paymentQrPath: QR,
    coverImage: COVER,
  },
});

console.log(`Updated ${result.count} ebook(s) → PDF ${PDF}`);
await prisma.$disconnect();
