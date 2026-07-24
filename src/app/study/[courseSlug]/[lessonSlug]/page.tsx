import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudyPlayer } from "@/components/study/StudyPlayer";
import { assertStudyAccess, flattenLessons } from "@/lib/study-access";
import { getCourseBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function StudyLessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const session = await getCurrentSession();
  const { courseSlug, lessonSlug } = await params;
  const course = await getCourseBySlug(courseSlug, session?.user.id);
  if (!course) {
    notFound();
  }

  const enrollment = Array.isArray(course.enrollments) ? course.enrollments[0] : null;
  const flat = flattenLessons(course.modules);
  const currentIndex = flat.findIndex((item) => item.slug === lessonSlug);
  if (currentIndex < 0) {
    notFound();
  }

  const current = flat[currentIndex];
  const lesson = course.modules
    .flatMap((module) => module.lessons)
    .find((item) => item.slug === lessonSlug);
  if (!lesson) {
    notFound();
  }

  const access = assertStudyAccess({
    role: session?.user.role,
    enrollment,
    courseSlug: course.slug,
    isLoggedIn: Boolean(session?.user),
    lessonIsPreview: lesson.isPreview,
  });
  if (!access.ok) {
    redirect(access.redirectTo);
  }

  const completedCount = flat.filter((item) => item.completed).length;
  const progressPercent = flat.length ? Math.round((completedCount / flat.length) * 100) : 0;
  const prevSlug = currentIndex > 0 ? flat[currentIndex - 1].slug : null;
  const nextSlug = currentIndex < flat.length - 1 ? flat[currentIndex + 1].slug : null;

  const outline = course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      type: item.type,
      durationMins: item.durationMins,
      completed: Array.isArray(item.progress)
        ? item.progress.some((progress) => progress.completedAt)
        : false,
    })),
  }));

  return (
    <div className="study-shell">
      <div className="study-shell__top">
        <Link href={`/study/${course.slug}`} className="study-shell__back">
          Course home
        </Link>
      </div>
      <StudyPlayer
        courseSlug={course.slug}
        courseTitle={course.title}
        modules={outline}
        lesson={{
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          content: lesson.content,
          type: lesson.type,
          durationMins: lesson.durationMins,
          completed: current.completed,
          assets: lesson.assets.map((asset) => ({
            id: asset.id,
            storagePath: asset.storagePath,
            mimeType: asset.mimeType,
            kind: asset.kind,
            label: asset.label,
          })),
        }}
        prevSlug={prevSlug}
        nextSlug={nextSlug}
        progressPercent={progressPercent}
        completedCount={completedCount}
        totalCount={flat.length}
      />
    </div>
  );
}
