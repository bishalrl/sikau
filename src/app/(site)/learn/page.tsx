import { LearnCourseGrid } from "@/components/learn/LearnCourseGrid";
import {
  LearnMasterclassCurriculum,
  summarizeCourseModules,
} from "@/components/learn/LearnMasterclassCurriculum";
import { LearnMasterclassFeatured } from "@/components/learn/LearnMasterclassFeatured";
import { getPublicCms } from "@/lib/cms/public";
import {
  getCourseBySlug,
  getHomepagePromoCourse,
  getLearnCategories,
  getPublishedCourses,
} from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function LearnPage() {
  const session = await getCurrentSession();
  const [courses, categories, cms] = await Promise.all([
    getPublishedCourses(session?.user.id),
    getLearnCategories(),
    getPublicCms(),
  ]);
  const explore = cms.sections["learn.explore"];
  const featured = cms.sections["learn.featured"];

  const featuredCourse =
    featured?.enabled === false
      ? null
      : await getHomepagePromoCourse(featured?.data.courseSlug || undefined);

  const featuredDetail = featuredCourse
    ? await getCourseBySlug(featuredCourse.slug, session?.user.id)
    : null;

  const enrollmentStatus = Array.isArray(featuredDetail?.enrollments)
    ? featuredDetail?.enrollments[0]?.paymentStatus ?? null
    : courses.find((course) => course.slug === featuredCourse?.slug)?.paymentStatus ?? null;

  const previewLesson = featuredDetail?.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.isPreview);

  const previewHref =
    featuredDetail && previewLesson
      ? `/study/${featuredDetail.slug}/${previewLesson.slug}`
      : null;

  const includes = (featured?.data.includes || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const features = featured?.items.map((item) => item.data.text).filter(Boolean) ?? [];

  return (
    <div className="bg-background">
      {featuredCourse && featuredDetail && (
        <>
          <LearnMasterclassFeatured
            courseSlug={featuredDetail.slug}
            title={featuredDetail.title}
            titleNe={featuredDetail.titleNe}
            subtitle={
              featured?.data.subtitle ||
              `by ${featuredDetail.instructorName}${featuredDetail.titleNe ? ` · ${featuredDetail.titleNe}` : ""}`
            }
            description={featuredDetail.description}
            image={featuredDetail.coverImage || featuredDetail.image}
            badge={featured?.data.badge}
            rating={featuredDetail.rating}
            students={featuredDetail.studentsCount}
            priceNpr={featuredDetail.priceNpr}
            listPrice={featured?.data.listPrice || undefined}
            cta={featured?.data.cta || "View course"}
            features={features}
            paymentStatus={enrollmentStatus}
            previewHref={previewHref}
          />
          <LearnMasterclassCurriculum
            courseSlug={featuredDetail.slug}
            modules={summarizeCourseModules(featuredDetail.modules)}
            includes={includes}
            priceNpr={featuredDetail.priceNpr}
            listPrice={featured?.data.listPrice || undefined}
            paymentStatus={enrollmentStatus}
            cta={featured?.data.cta || "View course"}
          />
        </>
      )}
      <LearnCourseGrid
        courses={courses}
        categories={categories}
        copy={{
          badge: explore?.data.badge,
          title: explore?.data.title,
          description: explore?.data.description,
        }}
      />
    </div>
  );
}
