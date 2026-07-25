import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CourseStatus, LessonType, UserRole, ContentStatus } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to seed.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "admin123", 10);
  const instructorPassword = await bcrypt.hash(process.env.SEED_INSTRUCTOR_PASSWORD || "instructor123", 10);
  const learnerPassword = await bcrypt.hash(process.env.SEED_LEARNER_PASSWORD || "learner123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sikaupaisa.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@sikaupaisa.com",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@sikaupaisa.com" },
    update: {},
    create: {
      name: "Raju Khatiwada",
      email: "instructor@sikaupaisa.com",
      passwordHash: instructorPassword,
      role: UserRole.INSTRUCTOR,
    },
  });

  await prisma.user.upsert({
    where: { email: "learner@sikaupaisa.com" },
    update: {},
    create: {
      name: "Learner Demo",
      email: "learner@sikaupaisa.com",
      passwordHash: learnerPassword,
      role: UserRole.LEARNER,
    },
  });

  const budgeting = await prisma.course.upsert({
    where: { slug: "budgeting-basics" },
    update: {},
    create: {
      slug: "budgeting-basics",
      title: "Budgeting Basics",
      titleNe: "बजेट बनाउने आधारभूत",
      description: "Learn to track income, expenses, and build your first monthly budget.",
      category: "Personal Finance",
      level: "Beginner",
      instructorName: "Raju Khatiwada",
      instructorId: instructor.id,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      featured: false,
      priceNpr: 0,
      durationText: "2h 30m",
      rating: 4.9,
      studentsCount: 2840,
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
      paymentInstructions: "This free course unlocks immediately after enrollment.",
    },
  });

  const masterclass = await prisma.course.upsert({
    where: { slug: "personal-finance-masterclass" },
    update: {},
    create: {
      slug: "personal-finance-masterclass",
      title: "Personal Finance Masterclass",
      titleNe: "पर्सनल फाइनान्स मास्टरक्लास",
      description:
        "Money mindset, portfolio building, real estate, side hustles, and retirement planning tailored for Nepal.",
      category: "Personal Finance",
      level: "Intermediate",
      instructorName: "Raju Khatiwada",
      instructorId: instructor.id,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      featured: true,
      priceNpr: 1999,
      durationText: "4h+",
      rating: 4.9,
      studentsCount: 5240,
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
      paymentInstructions: "Scan the QR / pay NPR 1,999, then upload your receipt for admin approval.",
    },
  });

  for (const course of [budgeting, masterclass]) {
    const module = await prisma.courseModule.upsert({
      where: { id: `seed-module-${course.slug}` },
      update: {},
      create: {
        id: `seed-module-${course.slug}`,
        courseId: course.id,
        title: "Getting Started",
        description: "First module to begin your learning journey.",
        sortOrder: 1,
      },
    });

    await prisma.lesson.upsert({
      where: {
        moduleId_slug: {
          moduleId: module.id,
          slug: "welcome-lesson",
        },
      },
      update: {},
      create: {
        moduleId: module.id,
        slug: "welcome-lesson",
        title: "Welcome Lesson",
        summary: "Orientation and learning outcomes.",
        content: `## Welcome\n\nStart your journey with ${course.title}.`,
        type: LessonType.READING,
        sortOrder: 1,
        durationMins: 10,
        isPreview: true,
      },
    });
  }

  await prisma.blogPost.upsert({
    where: { slug: "sip-for-beginners-nepal" },
    update: {},
    create: {
      slug: "sip-for-beginners-nepal",
      title: "SIP for Beginners in Nepal",
      titleNe: "नेपालमा SIP सुरु गर्ने तरिका",
      excerpt: "A practical starter guide to systematic investment plans for Nepali earners.",
      content:
        "## Why SIP works\n\nSmall monthly contributions compound over time.\n\n## Starter checklist\n\n- Open a DEMAT account\n- Choose a diversified fund\n- Automate the monthly amount",
      coverImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=500&fit=crop",
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: instructor.id,
    },
  });

  await prisma.ebook.upsert({
    where: { slug: "money-mindset-workbook" },
    update: {
      content: `## Chapter 1 — Money Awareness

Before you invest, you need clarity.

### Daily money check-in
- What did I earn today?
- What did I spend today?
- Was the spending planned?

## Chapter 2 — Needs vs Wants

List your top 10 monthly expenses and mark each as **Need** or **Want**.

## Chapter 3 — First SIP Habit

Start with a small monthly SIP you can continue for 12 months without stress.`,
    },
    create: {
      slug: "money-mindset-workbook",
      title: "Money Mindset Workbook",
      titleNe: "पैसा सोच अभ्यास पुस्तक",
      description: "Printable worksheets to audit expenses, set goals, and build better money habits.",
      content: `## Chapter 1 — Money Awareness

Before you invest, you need clarity.

### Daily money check-in
- What did I earn today?
- What did I spend today?
- Was the spending planned?

## Chapter 2 — Needs vs Wants

List your top 10 monthly expenses and mark each as **Need** or **Want**.

## Chapter 3 — First SIP Habit

Start with a small monthly SIP you can continue for 12 months without stress.`,
      coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=800&fit=crop",
      filePath: null,
      priceNpr: 0,
      isFree: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: instructor.id,
    },
  });

  await prisma.ebook.upsert({
    where: { slug: "sip-action-plan" },
    update: {
      content: `## SIP Action Plan

Use this ebook after unlocking paid access.

### Step 1
Decide your monthly investable surplus.

### Step 2
Choose 1–2 diversified funds.

### Step 3
Automate the SIP date with your salary cycle.`,
    },
    create: {
      slug: "sip-action-plan",
      title: "SIP Action Plan Ebook",
      titleNe: "SIP कार्य योजना",
      description: "A paid guide with ready-to-use SIP target tables and monthly checklists.",
      content: `## SIP Action Plan

Use this ebook after unlocking paid access.

### Step 1
Decide your monthly investable surplus.

### Step 2
Choose 1–2 diversified funds.

### Step 3
Automate the SIP date with your salary cycle.`,
      coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=800&fit=crop",
      filePath: null,
      priceNpr: 499,
      isFree: false,
      paymentInstructions: "Pay NPR 499 via QR and upload the receipt to unlock reading access.",
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: instructor.id,
    },
  });

  const nepseGuideContent = `## From Confused to Confident

Your step-by-step guide to professional trading in NEPSE.

### Phase 1 — Mindset & Introduction
Build the right foundation before you place a single trade.

### Phase 2 — Stock Market Basics
Understand how NEPSE works in clear, practical language.

### Phase 3 — Technical Analysis Foundations
Read charts with confidence using essential tools.

### Phase 4 — Core Trading Strategies
Apply 3 proven strategies designed for Nepali markets.

### Phase 5 — Risk Management & Execution
Protect capital and execute trades with discipline.

### Phase 6 — Psychology & Next Steps
Master emotions and create your personal trading plan.`;

  const NEPSE_COVER = "/rajuimageandqr/ebook-cover.jpeg";
  const NEPSE_PDF = "/rajuimageandqr/e-book.pdf";
  const NEPSE_QR = "/rajuimageandqr/bankqr.jpeg";

  await prisma.ebook.upsert({
    where: { slug: "nepse-trading-guide" },
    update: {
      title: "NEPSE Trading Guide",
      description:
        "From Confused to Confident: your step-by-step guide to professional trading in NEPSE. Ebook only — Rs 599.",
      content: nepseGuideContent,
      coverImage: NEPSE_COVER,
      filePath: NEPSE_PDF,
      paymentQrPath: NEPSE_QR,
      priceNpr: 599,
      isFree: false,
      paymentInstructions: "Pay NPR 599 via the bank QR and upload the receipt to unlock the ebook.",
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      slug: "nepse-trading-guide",
      title: "NEPSE Trading Guide",
      titleNe: "NEPSE ट्रेडिङ गाइड",
      description:
        "From Confused to Confident: your step-by-step guide to professional trading in NEPSE. Ebook only — Rs 599.",
      content: nepseGuideContent,
      coverImage: NEPSE_COVER,
      filePath: NEPSE_PDF,
      paymentQrPath: NEPSE_QR,
      priceNpr: 599,
      isFree: false,
      paymentInstructions: "Pay NPR 599 via the bank QR and upload the receipt to unlock the ebook.",
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: instructor.id,
    },
  });

  const nepseCommunityContent = `${nepseGuideContent}

---

## Lifetime Community Access

You also get:
- Lifetime membership in the Sikau Paisa trading community
- Entry to every monthly live session
- Ongoing Q&A and accountability with fellow traders`;

  await prisma.ebook.upsert({
    where: { slug: "nepse-trading-community" },
    update: {
      title: "NEPSE Guide + Lifetime Community",
      description:
        "Ebook plus lifetime community access and entry to every monthly live session — Rs 999.",
      content: nepseCommunityContent,
      coverImage: NEPSE_COVER,
      filePath: NEPSE_PDF,
      paymentQrPath: NEPSE_QR,
      priceNpr: 999,
      isFree: false,
      paymentInstructions:
        "Pay NPR 999 via the bank QR and upload the receipt to unlock the ebook and community access.",
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      slug: "nepse-trading-community",
      title: "NEPSE Guide + Lifetime Community",
      titleNe: "NEPSE गाइड + कम्युनिटी",
      description:
        "Ebook plus lifetime community access and entry to every monthly live session — Rs 999.",
      content: nepseCommunityContent,
      coverImage: NEPSE_COVER,
      filePath: NEPSE_PDF,
      paymentQrPath: NEPSE_QR,
      priceNpr: 999,
      isFree: false,
      paymentInstructions:
        "Pay NPR 999 via the bank QR and upload the receipt to unlock the ebook and community access.",
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: instructor.id,
    },
  });

  const communityEbook = await prisma.ebook.findUnique({
    where: { slug: "nepse-trading-community" },
  });

  const nepseCommunity = await prisma.community.upsert({
    where: { slug: "nepse-lifetime-community" },
    update: {
      name: "NEPSE Lifetime Community",
      description:
        "Exclusive trading community for NEPSE Guide + Lifetime Community members. Charts, Q&A, and accountability.",
      coverImage: NEPSE_COVER,
      status: "ACTIVE",
    },
    create: {
      slug: "nepse-lifetime-community",
      name: "NEPSE Lifetime Community",
      description:
        "Exclusive trading community for NEPSE Guide + Lifetime Community members. Charts, Q&A, and accountability.",
      coverImage: NEPSE_COVER,
      status: "ACTIVE",
      permissions: JSON.stringify({ text: "ALL", media: "ALL", voice: "MODS" }),
    },
  });

  if (communityEbook) {
    await prisma.communityEbookLink.upsert({
      where: {
        communityId_ebookId: {
          communityId: nepseCommunity.id,
          ebookId: communityEbook.id,
        },
      },
      update: {},
      create: {
        communityId: nepseCommunity.id,
        ebookId: communityEbook.id,
      },
    });

    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: nepseCommunity.id,
          userId: admin.id,
        },
      },
      update: { role: "ADMIN" },
      create: {
        communityId: nepseCommunity.id,
        userId: admin.id,
        role: "ADMIN",
      },
    });
  }

  const existingLive = await prisma.liveSession.findFirst({
    where: {
      title: "Monthly NEPSE Live Session",
      status: "SCHEDULED",
    },
  });

  if (!existingLive) {
    await prisma.liveSession.create({
      data: {
        title: "Monthly NEPSE Live Session",
        description: "Live Q&A and chart walkthrough for community members and enrolled learners.",
        scheduledAt: new Date("2026-08-19T08:00:00+05:45"),
        status: "SCHEDULED",
        hostId: admin.id,
      },
    });
  }

  const contentEntries = [
    [
      "site.footer.description",
      "Footer description",
      "Empowering every Nepali household with the right knowledge of money, saving, investing and wealth creation. Founded by Raju Khatiwada.",
    ],
    ["learn.explore.title", "Learn page title", "Explore More Lessons"],
    [
      "learn.explore.description",
      "Learn page description",
      "Browse premium and free courses across personal finance, investing, and digital payments.",
    ],
    ["dashboard.hero.title", "Dashboard title", "Welcome back, Learner!"],
    ["home.hero.title", "Landing hero title", "Take Control of\n\nYour Money"],
  ];

  for (const [key, title, markdown] of contentEntries) {
    await prisma.websiteContent.upsert({
      where: { key_locale: { key, locale: "en" } },
      update: {},
      create: {
        key,
        locale: "en",
        title,
        markdown,
        status: ContentStatus.PUBLISHED,
        updatedById: admin.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
