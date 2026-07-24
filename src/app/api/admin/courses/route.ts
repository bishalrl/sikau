import { AssetKind, CourseStatus, LessonType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const lessonSchema = z.object({
  title: z.string().min(1),
  titleNe: z.string().optional(),
  slug: z.string().min(1),
  summary: z.string().optional(),
  content: z.string().optional(),
  type: z.nativeEnum(LessonType).default(LessonType.READING),
  durationMins: z.coerce.number().min(1).default(10),
  isPreview: z.boolean().default(false),
  assets: z
    .array(
      z.object({
        storagePath: z.string().min(1),
        mimeType: z.string().default("application/octet-stream"),
        kind: z.nativeEnum(AssetKind).default(AssetKind.FILE),
        label: z.string().optional(),
      }),
    )
    .default([]),
});

const moduleSchema = z.object({
  title: z.string().min(1),
  titleNe: z.string().optional(),
  description: z.string().optional(),
  lessons: z.array(lessonSchema).min(1),
});

const courseSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  titleNe: z.string().optional(),
  description: z.string().min(1),
  descriptionNe: z.string().optional(),
  category: z.string().min(1),
  level: z.string().min(1),
  image: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  paymentQrPath: z.string().optional(),
  instructorName: z.string().min(1),
  priceNpr: z.coerce.number().min(0).default(0),
  paymentInstructions: z.string().optional(),
  featured: z.boolean().default(false),
  durationText: z.string().optional(),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
  modules: z.array(moduleSchema).min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = courseSchema.parse(await request.json());

    const course = await prisma.$transaction(async (tx) => {
      const saved = await tx.course.upsert({
        where: { slug: input.slug },
        update: {
          title: input.title,
          titleNe: input.titleNe,
          description: input.description,
          descriptionNe: input.descriptionNe,
          category: input.category,
          level: input.level,
          image: input.image || null,
          coverImage: input.coverImage || null,
          paymentQrPath: input.paymentQrPath || null,
          instructorName: input.instructorName,
          priceNpr: input.priceNpr,
          paymentInstructions: input.paymentInstructions,
          featured: input.featured,
          durationText: input.durationText,
          status: session.user.role === "ADMIN" ? input.status : CourseStatus.PENDING_REVIEW,
          reviewedById: session.user.role === "ADMIN" ? session.user.id : null,
          publishedAt:
            (session.user.role === "ADMIN" ? input.status : CourseStatus.PENDING_REVIEW) === CourseStatus.PUBLISHED
              ? new Date()
              : null,
        },
        create: {
          slug: input.slug,
          title: input.title,
          titleNe: input.titleNe,
          description: input.description,
          descriptionNe: input.descriptionNe,
          category: input.category,
          level: input.level,
          image: input.image || null,
          coverImage: input.coverImage || null,
          paymentQrPath: input.paymentQrPath || null,
          instructorName: input.instructorName,
          priceNpr: input.priceNpr,
          paymentInstructions: input.paymentInstructions,
          featured: input.featured,
          durationText: input.durationText,
          instructorId: session.user.id,
          status: session.user.role === "ADMIN" ? input.status : CourseStatus.PENDING_REVIEW,
          publishedAt:
            (session.user.role === "ADMIN" ? input.status : CourseStatus.PENDING_REVIEW) === CourseStatus.PUBLISHED
              ? new Date()
              : null,
        },
      });

      await tx.courseModule.deleteMany({
        where: { courseId: saved.id },
      });

      for (const [moduleIndex, module] of input.modules.entries()) {
        const createdModule = await tx.courseModule.create({
          data: {
            courseId: saved.id,
            title: module.title,
            titleNe: module.titleNe,
            description: module.description,
            sortOrder: moduleIndex + 1,
          },
        });

        for (const [lessonIndex, lesson] of module.lessons.entries()) {
          const createdLesson = await tx.lesson.create({
            data: {
              moduleId: createdModule.id,
              slug: lesson.slug,
              title: lesson.title,
              titleNe: lesson.titleNe,
              summary: lesson.summary,
              content: lesson.content,
              type: lesson.type,
              sortOrder: lessonIndex + 1,
              durationMins: lesson.durationMins,
              isPreview: lesson.isPreview,
            },
          });

          for (const asset of lesson.assets) {
            await tx.lessonAsset.create({
              data: {
                lessonId: createdLesson.id,
                storagePath: asset.storagePath,
                mimeType: asset.mimeType,
                kind: asset.kind,
                label: asset.label,
              },
            });
          }
        }
      }

      return saved;
    });

    return NextResponse.json({ course });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to save course." }, { status: 500 });
  }
}
