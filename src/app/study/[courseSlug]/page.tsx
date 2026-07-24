import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { assertStudyAccess, findResumeLessonSlug, flattenLessons } from "@/lib/study-access";
import { getCourseBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function StudyCoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const session = await getCurrentSession();
  const { courseSlug } = await params;
  const course = await getCourseBySlug(courseSlug, session?.user.id);

  if (!course) {
    notFound();
  }

  const enrollment = Array.isArray(course.enrollments) ? course.enrollments[0] : null;
  const access = assertStudyAccess({
    role: session?.user.role,
    enrollment,
    courseSlug: course.slug,
    isLoggedIn: Boolean(session?.user),
  });
  if (!access.ok) {
    redirect(access.redirectTo);
  }

  const flat = flattenLessons(course.modules);
  const completed = flat.filter((lesson) => lesson.completed).length;
  const percent = flat.length ? Math.round((completed / flat.length) * 100) : 0;
  const resumeSlug = findResumeLessonSlug(flat);
  const ctaLabel = completed === 0 ? "Start course" : percent === 100 ? "Review course" : "Continue learning";

  return (
    <div className="site-container py-xl">
      <div className="study-overview">
        <section className="study-overview__hero">
          <p className="study-overview__eyebrow">Course home</p>
          <h1 className="study-overview__title">{course.title}</h1>
          {course.titleNe && <p className="study-overview__title-ne">{course.titleNe}</p>}
          <p className="study-overview__desc">{course.description}</p>

          <div className="study-overview__stats">
            <div>
              <p className="study-overview__stat-value">{percent}%</p>
              <p className="study-overview__stat-label">Complete</p>
            </div>
            <div>
              <p className="study-overview__stat-value">
                {completed}/{flat.length}
              </p>
              <p className="study-overview__stat-label">Lessons done</p>
            </div>
            <div>
              <p className="study-overview__stat-value">{course.modules.length}</p>
              <p className="study-overview__stat-label">Modules</p>
            </div>
          </div>

          <div className="study-overview__progress-track">
            <div className="study-overview__progress-fill" style={{ width: `${percent}%` }} />
          </div>

          {resumeSlug && (
            <div className="mt-6">
              <Button size="lg" href={`/study/${course.slug}/${resumeSlug}`}>
                {ctaLabel}
              </Button>
            </div>
          )}
        </section>

        <section className="study-overview__modules">
          <h2 className="study-overview__section-title">Syllabus</h2>
          <div className="space-y-4">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="study-overview__module">
                <h3 className="study-overview__module-title">
                  Module {moduleIndex + 1}: {module.title}
                </h3>
                {module.description && (
                  <p className="study-overview__module-desc">{module.description}</p>
                )}
                <ul className="study-overview__lessons">
                  {module.lessons.map((lesson) => {
                    const done = Array.isArray(lesson.progress)
                      ? lesson.progress.some((item) => item.completedAt)
                      : false;

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/study/${course.slug}/${lesson.slug}`}
                          className={`study-overview__lesson ${done ? "is-done" : ""}`}
                        >
                          <span className="study-overview__lesson-icon">
                            {done ? (
                              <CheckCircle2 size={18} />
                            ) : lesson.type === "VIDEO" ? (
                              <PlayCircle size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </span>
                          <span className="study-overview__lesson-copy">
                            <span className="study-overview__lesson-name">{lesson.title}</span>
                            <span className="study-overview__lesson-meta">
                              {lesson.type} · {lesson.durationMins} min
                            </span>
                          </span>
                          <span className="study-overview__lesson-state">{done ? "Done" : "Open"}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
