import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollButton } from "@/components/learn/EnrollButton";
import { CmsImage } from "@/components/cms/CmsImage";
import { Button } from "@/components/ui/Button";
import { getCourseBySlug } from "@/lib/repositories";
import { isElevatedRole } from "@/lib/roles";
import { getCurrentSession } from "@/lib/session";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "PUBLISHED") {
    return { title: { absolute: "Course | Sikau Paisa" } };
  }
  return {
    title: { absolute: `${course.title} | Sikau Paisa` },
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: course.image || course.coverImage ? [course.image || course.coverImage || ""] : undefined,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const session = await getCurrentSession();
  const { slug } = await params;
  const course = await getCourseBySlug(slug, session?.user.id);

  if (!course || (course.status !== "PUBLISHED" && !isElevatedRole(session?.user.role))) {
    notFound();
  }

  const enrollment = Array.isArray(course.enrollments) ? course.enrollments[0] : null;
  const status = enrollment?.paymentStatus ?? null;
  const isFree = course.priceNpr <= 0;
  const cover = course.coverImage || course.image;
  const lessonCount = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const minutes = course.modules.reduce(
    (sum, module) => sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.durationMins, 0),
    0,
  );
  const previewCount = course.modules.reduce(
    (sum, module) => sum + module.lessons.filter((lesson) => lesson.isPreview).length,
    0,
  );

  return (
    <div className="bg-surface pb-24 lg:pb-xl">
      <div className="site-container py-lg">
        <Link href="/learn" className="text-sm font-medium text-primary">
          ← All courses
        </Link>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-white">
              {cover && (
                <div className="relative aspect-[16/8] bg-surface-container">
                  <CmsImage src={cover} alt={course.title} fill className="object-cover" />
                </div>
              )}
              <div className="space-y-4 p-6 sm:p-8">
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  <span>{course.category}</span>
                  <span>·</span>
                  <span>{course.level}</span>
                  {course.featured && (
                    <>
                      <span>·</span>
                      <span>Featured</span>
                    </>
                  )}
                </div>
                <div>
                  <h1 className="font-display-md text-display-md text-on-background">{course.title}</h1>
                  {course.titleNe && <p className="mt-2 text-lg text-primary">{course.titleNe}</p>}
                </div>
                <p className="text-sm text-on-surface-variant">
                  Taught by {course.instructorName}
                  {course.rating > 0 ? ` · ${course.rating} rating` : ""}
                  {course.studentsCount > 0 ? ` · ${course.studentsCount.toLocaleString()} students` : ""}
                </p>
                <p className="max-w-3xl text-base leading-7 text-on-surface">{course.description}</p>
                {course.descriptionNe && (
                  <p className="max-w-3xl text-base leading-7 text-on-surface-variant">{course.descriptionNe}</p>
                )}
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Fact label="Lessons" value={String(lessonCount)} />
                  <Fact label="Sections" value={String(course.modules.length)} />
                  <Fact label="Length" value={course.durationText || (minutes ? `${minutes} min` : "Self-paced")} />
                  <Fact label="Price" value={isFree ? "Free" : `NPR ${course.priceNpr.toLocaleString()}`} />
                </dl>
              </div>
            </div>

            <section className="rounded-3xl border border-outline-variant/30 bg-white p-6 sm:p-8">
              <h2 className="font-headline-md text-on-background">What you’ll learn</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {previewCount
                  ? `${previewCount} lesson${previewCount === 1 ? "" : "s"} can be previewed before you join.`
                  : "Join to open every lesson."}
              </p>
              <div className="mt-6 space-y-5">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id}>
                    <h3 className="font-semibold text-on-background">
                      {moduleIndex + 1}. {module.title}
                    </h3>
                    {module.titleNe && <p className="text-sm text-primary">{module.titleNe}</p>}
                    {module.description && <p className="mt-1 text-sm text-on-surface-variant">{module.description}</p>}
                    <ul className="mt-3 divide-y divide-outline-variant/20 rounded-2xl border border-outline-variant/20">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const canPreview = lesson.isPreview;
                        const inner = (
                          <>
                            <span className="min-w-0">
                              <span className="block font-medium text-on-background">
                                {lessonIndex + 1}. {lesson.title}
                              </span>
                              {lesson.summary && (
                                <span className="mt-0.5 block text-sm text-on-surface-variant">{lesson.summary}</span>
                              )}
                            </span>
                            <span className="shrink-0 text-right text-xs text-on-surface-variant">
                              <span className="block">{lesson.durationMins} min</span>
                              <span className="mt-1 block font-semibold text-primary">
                                {canPreview ? "Preview" : "Included"}
                              </span>
                            </span>
                          </>
                        );
                        return (
                          <li key={lesson.id}>
                            {canPreview ? (
                              <Link
                                href={`/study/${course.slug}/${lesson.slug}`}
                                className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-surface-container-low"
                              >
                                {inner}
                              </Link>
                            ) : (
                              <div className="flex items-start justify-between gap-4 px-4 py-3">{inner}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <JoinCard
              courseSlug={course.slug}
              isFree={isFree}
              priceNpr={course.priceNpr}
              status={status}
              paymentInstructions={course.paymentInstructions}
              lessonCount={lessonCount}
            />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-outline-variant/30 bg-white/95 p-3 backdrop-blur lg:hidden">
        <JoinActions courseSlug={course.slug} isFree={isFree} status={status} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low px-3 py-3">
      <dt className="text-xs text-on-surface-variant">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-on-background">{value}</dd>
    </div>
  );
}

function JoinCard({
  courseSlug,
  isFree,
  priceNpr,
  status,
  paymentInstructions,
  lessonCount,
}: {
  courseSlug: string;
  isFree: boolean;
  priceNpr: number;
  status: string | null;
  paymentInstructions: string | null;
  lessonCount: number;
}) {
  return (
    <div className="rounded-3xl border border-outline-variant/30 bg-white p-5">
      <p className="text-sm text-on-surface-variant">{isFree ? "Free to join" : "One-time payment"}</p>
      <p className="mt-1 text-3xl font-bold text-on-background">{isFree ? "Free" : `NPR ${priceNpr.toLocaleString()}`}</p>
      <p className="mt-2 text-sm text-on-surface-variant">{lessonCount} lessons included after you join.</p>
      <div className="mt-5 hidden lg:block">
        <JoinActions courseSlug={courseSlug} isFree={isFree} status={status} />
      </div>
      {!isFree && status !== "APPROVED" && (
        <p className="mt-4 text-sm text-on-surface-variant">
          {paymentInstructions || "After you join, pay with the QR and upload your receipt. Access opens when the payment is approved."}
        </p>
      )}
    </div>
  );
}

function JoinActions({
  courseSlug,
  isFree,
  status,
}: {
  courseSlug: string;
  isFree: boolean;
  status: string | null;
}) {
  if (status === "APPROVED") {
    return (
      <Button size="lg" className="w-full" href={`/study/${courseSlug}`}>
        Continue learning
      </Button>
    );
  }
  if (status === "PENDING") {
    return (
      <Button size="lg" variant="outline" className="w-full" href={`/payment/${courseSlug}`}>
        Complete payment
      </Button>
    );
  }
  return (
    <EnrollButton
      courseSlug={courseSlug}
      label={isFree ? "Join free" : "Join course"}
      size="lg"
      returnTo={`/learn/${courseSlug}`}
    />
  );
}
