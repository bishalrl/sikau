import { CourseStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { defaultWebsiteContent } from "@/lib/site-defaults";
import { categories, courses as fallbackCourses, dashboardStats, masterclassModules } from "@/lib/data";

type SessionUser = {
  id: string;
  role: "ADMIN" | "INSTRUCTOR" | "LEARNER";
};

export type CourseCard = {
  id: string;
  slug: string;
  title: string;
  titleNe: string | null;
  description: string;
  category: string;
  level: string;
  duration: string;
  lessons: number;
  progress?: number;
  rating: number;
  students: number;
  instructor: string;
  featured: boolean;
  image: string;
  paymentStatus: PaymentStatus | null;
};

export type WebsiteContentRecord = {
  id?: string;
  key: string;
  locale: string;
  title: string;
  markdown: string;
  status: "DRAFT" | "PUBLISHED";
};

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasDatabase()) {
    return fallback;
  }

  try {
    return await query();
  } catch {
    return fallback;
  }
}

function fallbackCourseCards(): CourseCard[] {
  return fallbackCourses.map((course) => ({
    ...course,
    slug: course.id,
    titleNe: course.titleNe ?? null,
    duration: course.duration,
    instructor: course.instructor,
    featured: course.featured ?? false,
    paymentStatus: null,
  }));
}

export async function getWebsiteContent(locale = "en"): Promise<WebsiteContentRecord[]> {
  const fallback: WebsiteContentRecord[] = Object.entries(defaultWebsiteContent).map(([key, value]) => ({
    key,
    locale,
    title: value.title,
    markdown: value.markdown,
    status: "PUBLISHED" as const,
  }));

  return safeQuery(
    async () => {
      const records = await prisma.websiteContent.findMany({
        where: { locale },
        orderBy: { key: "asc" },
      });

      return records.map((record): WebsiteContentRecord => ({
        id: record.id,
        key: record.key,
        locale: record.locale,
        title: record.title,
        markdown: record.markdown,
        status: record.status,
      }));
    },
    fallback,
  );
}

export async function getWebsiteContentMap(locale = "en") {
  const records = await getWebsiteContent(locale);
  return records.reduce<Record<string, WebsiteContentRecord>>((acc, item) => {
    acc[item.key] = item;
    return acc;
  }, {});
}

export async function upsertWebsiteContent(input: {
  key: string;
  locale?: string;
  title: string;
  markdown: string;
  status: "DRAFT" | "PUBLISHED";
  userId?: string;
}) {
  return prisma.websiteContent.upsert({
    where: {
      key_locale: {
        key: input.key,
        locale: input.locale ?? "en",
      },
    },
    update: {
      title: input.title,
      markdown: input.markdown,
      status: input.status,
      updatedById: input.userId,
    },
    create: {
      key: input.key,
      locale: input.locale ?? "en",
      title: input.title,
      markdown: input.markdown,
      status: input.status,
      updatedById: input.userId,
    },
  });
}

export async function getPublishedCourses(userId?: string) {
  return safeQuery(
    async () => {
      const records = await prisma.course.findMany({
        where: { status: CourseStatus.PUBLISHED },
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  progress: userId ? { where: { userId } } : false,
                },
              },
            },
          },
          enrollments: userId
            ? {
                where: { userId },
                include: {
                  payment: true,
                },
              }
            : false,
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      });

      return records.map((course) => {
        const lessons = course.modules.flatMap((module) => module.lessons);
        const lessonCount = lessons.length;
        const enrollment = Array.isArray(course.enrollments) ? course.enrollments[0] : undefined;
        const completed =
          enrollment?.paymentStatus === PaymentStatus.APPROVED
            ? lessons.filter((lesson) =>
                Array.isArray(lesson.progress) ? lesson.progress.some((item) => item.completedAt) : false,
              ).length
            : 0;
        const progress =
          enrollment?.paymentStatus === PaymentStatus.APPROVED && lessonCount
            ? Math.round((completed / lessonCount) * 100)
            : undefined;

        return {
          id: course.id,
          slug: course.slug,
          title: course.title,
          titleNe: course.titleNe,
          description: course.description,
          category: course.category,
          level: course.level,
          duration: course.durationText ?? `${lessonCount} lessons`,
          lessons: lessonCount,
          progress,
          rating: course.rating,
          students: course.studentsCount,
          instructor: course.instructorName,
          featured: course.featured,
          image: course.image ?? "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
          paymentStatus: enrollment?.paymentStatus ?? null,
        } satisfies CourseCard;
      });
    },
    fallbackCourseCards(),
  );
}

export async function getCourseBySlug(slug: string, userId?: string) {
  return safeQuery(
    async () => {
      return prisma.course.findUnique({
        where: { slug },
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  assets: true,
                  progress: userId ? { where: { userId } } : false,
                },
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          enrollments: userId ? { where: { userId }, include: { payment: true } } : false,
        },
      });
    },
    null,
  );
}

export async function getDashboardData(user?: SessionUser | null) {
  const fallback = {
    stats: dashboardStats,
    courses: fallbackCourseCards().filter((course) => course.progress && course.progress < 100),
    recentActivity: [
      { action: "Completed quiz: Budgeting Basics", xp: "+50 XP", time: "2h ago" },
      { action: "Finished lesson: Compound Interest", xp: "+30 XP", time: "Yesterday" },
      { action: "7-day streak milestone!", xp: "+100 XP", time: "2 days ago" },
    ],
  };

  if (!user) {
    return fallback;
  }

  return safeQuery(async () => {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        paymentStatus: PaymentStatus.APPROVED,
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  include: {
                    progress: {
                      where: { userId: user.id },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const courses = enrollments.map((enrollment) => {
      const lessons = enrollment.course.modules.flatMap((module) => module.lessons);
      const completed = lessons.filter((lesson) => lesson.progress.some((item) => item.completedAt)).length;
      const progress = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;

      return {
        id: enrollment.course.id,
        slug: enrollment.course.slug,
        title: enrollment.course.title,
        titleNe: enrollment.course.titleNe,
        description: enrollment.course.description,
        category: enrollment.course.category,
        level: enrollment.course.level,
        duration: enrollment.course.durationText ?? `${lessons.length} lessons`,
        lessons: lessons.length,
        progress,
        rating: enrollment.course.rating,
        students: enrollment.course.studentsCount,
        instructor: enrollment.course.instructorName,
          featured: enrollment.course.featured,
        image:
          enrollment.course.image ??
            "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
          paymentStatus: enrollment.paymentStatus,
      } satisfies CourseCard;
    });

    return {
      stats: {
        ...dashboardStats,
        coursesInProgress: courses.filter((item) => item.progress && item.progress < 100).length,
        coursesCompleted: courses.filter((item) => item.progress === 100).length,
      },
      courses,
      recentActivity: courses.slice(0, 3).map((course) => ({
        action: `Continued course: ${course.title}`,
        xp: `+${Math.max(course.progress ?? 0, 10)} XP`,
        time: "Recently",
      })),
    };
  }, fallback);
}

export async function getAdminOverview() {
  return safeQuery(async () => {
    const [users, courses, payments, content, blogs, ebooks, ebookOrders, newsletter] = await Promise.all([
      prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
      prisma.course.count(),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      prisma.websiteContent.count(),
      prisma.blogPost.count(),
      prisma.ebook.count(),
      prisma.ebookOrder.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
      prisma.newsletterSubscriber.count(),
    ]);

    return {
      users,
      courses,
      pendingPayments: payments + ebookOrders,
      contentEntries: content,
      blogs,
      ebooks,
      newsletter,
    };
  }, {
    users: 0,
    courses: fallbackCourses.length,
    pendingPayments: 0,
    contentEntries: Object.keys(defaultWebsiteContent).length,
    blogs: 0,
    ebooks: 0,
    newsletter: 0,
  });
}

export type VerifiedUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "LEARNER";
  authProvider: string;
  emailVerifiedAt: Date;
  createdAt: Date;
};

export async function getVerifiedUsers(): Promise<VerifiedUserRow[]> {
  return safeQuery(async () => {
    const users = await prisma.user.findMany({
      where: { emailVerifiedAt: { not: null } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        authProvider: true,
        passwordHash: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider || (user.passwordHash ? "email" : "google"),
      emailVerifiedAt: user.emailVerifiedAt as Date,
      createdAt: user.createdAt,
    }));
  }, [] as VerifiedUserRow[]);
}

export type NewsletterSubscriberRow = {
  id: string;
  email: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriberRow[]> {
  return safeQuery(async () => {
    return prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }, [] as NewsletterSubscriberRow[]);
}

export async function getManageableCourses(user?: SessionUser | null) {
  const where: Prisma.CourseWhereInput =
    user?.role === "ADMIN"
      ? {}
      : user?.id
        ? { instructorId: user.id }
        : { status: CourseStatus.PUBLISHED };

  return safeQuery(async () => {
    return prisma.course.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
              include: { assets: true },
            },
          },
        },
      },
    });
  }, []);
}

export async function getPendingPayments() {
  return safeQuery(async () => {
    return prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING },
      include: {
        enrollment: {
          include: {
            course: true,
            user: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }, []);
}

export async function getLearnCategories() {
  return categories;
}

export async function getMasterclassModules() {
  return masterclassModules;
}

const fallbackBlogs = [
  {
    id: "blog-1",
    slug: "sip-for-beginners-nepal",
    title: "SIP for Beginners in Nepal",
    titleNe: "नेपालमा SIP सुरु गर्ने तरिका",
    excerpt: "A practical starter guide to systematic investment plans for Nepali earners.",
    content:
      "## Why SIP works\n\nSmall monthly contributions compound over time.\n\n## Starter checklist\n\n- Open a DEMAT account\n- Choose a diversified fund\n- Automate the monthly amount",
    coverImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=500&fit=crop",
    status: "PUBLISHED" as const,
    publishedAt: new Date(),
    author: { name: "Raju Khatiwada" },
  },
];

const fallbackEbooks = [
  {
    id: "ebook-1",
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
    filePath: null as string | null,
    priceNpr: 0,
    isFree: true,
    paymentQrPath: null as string | null,
    paymentInstructions: null as string | null,
    status: "PUBLISHED" as const,
    paymentStatus: null as PaymentStatus | null,
  },
];

export async function getPublishedBlogPosts() {
  return safeQuery(async () => {
    return prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      include: { author: { select: { name: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  }, fallbackBlogs as never);
}

export async function getBlogPostBySlug(slug: string) {
  return safeQuery(async () => {
    return prisma.blogPost.findUnique({
      where: { slug },
      include: { author: { select: { name: true, email: true } } },
    });
  }, (fallbackBlogs.find((post) => post.slug === slug) as never) ?? null);
}

export async function getManageableBlogPosts() {
  return safeQuery(async () => {
    return prisma.blogPost.findMany({
      include: { author: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }, fallbackBlogs as never);
}

export async function getPublishedEbooks(userId?: string) {
  return safeQuery(async () => {
    const records = await prisma.ebook.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        titleNe: true,
        description: true,
        content: true,
        coverImage: true,
        filePath: true,
        priceNpr: true,
        isFree: true,
        paymentQrPath: true,
        paymentInstructions: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        orders: userId ? { where: { userId } } : false,
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return records.map((ebook) => ({
      ...ebook,
      paymentStatus: Array.isArray(ebook.orders) ? ebook.orders[0]?.paymentStatus ?? null : null,
    }));
  }, fallbackEbooks as never);
}

export async function getEbookBySlug(slug: string, userId?: string) {
  return safeQuery(async () => {
    const ebook = await prisma.ebook.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        titleNe: true,
        description: true,
        content: true,
        coverImage: true,
        filePath: true,
        priceNpr: true,
        isFree: true,
        paymentQrPath: true,
        paymentInstructions: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        orders: userId ? { where: { userId } } : false,
        author: { select: { name: true } },
      },
    });

    if (!ebook) return null;

    return {
      ...ebook,
      paymentStatus: Array.isArray(ebook.orders) ? ebook.orders[0]?.paymentStatus ?? null : null,
      order: Array.isArray(ebook.orders) ? ebook.orders[0] ?? null : null,
    };
  }, (fallbackEbooks.find((item) => item.slug === slug) as never) ?? null);
}

export async function getManageableEbooks() {
  return safeQuery(async () => {
    return prisma.ebook.findMany({
      include: { author: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }, [] as never);
}

const NEPSE_LANDING_SLUGS = ["nepse-trading-guide", "nepse-trading-community"] as const;

export async function getNepseLandingEbookPricing() {
  return safeQuery(async () => {
    const records = await prisma.ebook.findMany({
      where: { slug: { in: [...NEPSE_LANDING_SLUGS] }, status: "PUBLISHED" },
      select: {
        slug: true,
        priceNpr: true,
        listPriceNpr: true,
        promoEndsAt: true,
        isFree: true,
      },
    });
    return records;
  }, [] as never);
}

export async function getPendingEbookOrders() {
  return safeQuery(async () => {
    return prisma.ebookOrder.findMany({
      where: { paymentStatus: PaymentStatus.PENDING },
      include: {
        ebook: true,
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }, []);
}

export async function userHasDashboardAccess(userId: string, role?: string | null) {
  if (role === "ADMIN" || role === "INSTRUCTOR") {
    return true;
  }

  return safeQuery(async () => {
    const [enrollment, ebookOrder] = await Promise.all([
      prisma.enrollment.findFirst({
        where: { userId, paymentStatus: PaymentStatus.APPROVED },
        select: { id: true },
      }),
      prisma.ebookOrder.findFirst({
        where: { userId, paymentStatus: PaymentStatus.APPROVED },
        select: { id: true },
      }),
    ]);
    return Boolean(enrollment || ebookOrder);
  }, false);
}

export async function getUnlockedEbooks(userId: string) {
  return safeQuery(async () => {
    const records = await prisma.ebook.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { isFree: true },
          { priceNpr: { lte: 0 } },
          { orders: { some: { userId, paymentStatus: PaymentStatus.APPROVED } } },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return records;
  }, fallbackEbooks.filter((item) => item.isFree || item.priceNpr <= 0) as never);
}

export async function getUpcomingLiveSessions() {
  return safeQuery(async () => {
    return prisma.liveSession.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
      },
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ scheduledAt: "asc" }],
    });
  }, []);
}

export async function getManageableLiveSessions() {
  return safeQuery(async () => {
    return prisma.liveSession.findMany({
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ scheduledAt: "desc" }],
    });
  }, []);
}

export async function getLiveSessionById(id: string) {
  return safeQuery(async () => {
    return prisma.liveSession.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
    });
  }, null);
}
