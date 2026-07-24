import { isElevatedRole } from "@/lib/roles";

type EnrollmentLike = {
  paymentStatus?: string | null;
} | null;

export function assertStudyAccess(options: {
  role?: string | null;
  enrollment: EnrollmentLike;
  courseSlug: string;
  isLoggedIn: boolean;
  lessonIsPreview?: boolean;
}): { ok: true } | { ok: false; redirectTo: string } {
  const { role, enrollment, courseSlug, isLoggedIn, lessonIsPreview } = options;

  if (isElevatedRole(role)) {
    return { ok: true };
  }

  if (!isLoggedIn) {
    return {
      ok: false,
      redirectTo: `/login?callbackUrl=${encodeURIComponent(`/study/${courseSlug}`)}`,
    };
  }

  if (lessonIsPreview) {
    return { ok: true };
  }

  if (enrollment?.paymentStatus === "APPROVED") {
    return { ok: true };
  }

  if (enrollment?.paymentStatus === "PENDING") {
    return { ok: false, redirectTo: `/payment/${courseSlug}` };
  }

  return { ok: false, redirectTo: `/payment/${courseSlug}` };
}

export function flattenLessons<
  T extends {
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      type: string;
      durationMins: number;
      progress?: Array<{ completedAt: Date | null }> | false;
    }>;
  },
>(modules: T[]) {
  return modules.flatMap((module, moduleIndex) =>
    module.lessons.map((lesson, lessonIndex) => ({
      ...lesson,
      moduleIndex,
      lessonIndex,
      completed: Array.isArray(lesson.progress)
        ? lesson.progress.some((item) => item.completedAt)
        : false,
    })),
  );
}

export function findResumeLessonSlug(
  lessons: Array<{ slug: string; completed: boolean }>,
) {
  return lessons.find((lesson) => !lesson.completed)?.slug ?? lessons[0]?.slug ?? null;
}
