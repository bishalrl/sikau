import { LearnCourseGrid } from "@/components/learn/LearnCourseGrid";
import { LearnMasterclassCurriculum } from "@/components/learn/LearnMasterclassCurriculum";
import { LearnMasterclassFeatured } from "@/components/learn/LearnMasterclassFeatured";
import {
  getCourseBySlug,
  getLearnCategories,
  getPublishedCourses,
  getWebsiteContentMap,
} from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

const MASTERCLASS_SLUG = "personal-finance-masterclass";

export default async function LearnPage() {
  const session = await getCurrentSession();
  const [courses, categories, content] = await Promise.all([
    getPublishedCourses(session?.user.id),
    getLearnCategories(),
    getWebsiteContentMap(),
  ]);

  const masterclass =
    courses.find((course) => course.slug === MASTERCLASS_SLUG) ??
    courses.find((course) => course.featured) ??
    courses[0];

  const masterclassDetail = masterclass
    ? await getCourseBySlug(masterclass.slug, session?.user.id)
    : null;

  const previewLesson = masterclassDetail?.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.isPreview);

  const previewHref =
    masterclass && previewLesson
      ? `/study/${masterclass.slug}/${previewLesson.slug}`
      : null;

  return (
    <div className="bg-background">
      <LearnMasterclassFeatured
        courseSlug={masterclass?.slug ?? MASTERCLASS_SLUG}
        priceNpr={1999}
        paymentStatus={masterclass?.paymentStatus}
        previewHref={previewHref}
      />
      <LearnMasterclassCurriculum
        courseSlug={masterclass?.slug ?? MASTERCLASS_SLUG}
        paymentStatus={masterclass?.paymentStatus}
      />
      <LearnCourseGrid
        courses={courses}
        categories={categories}
        copy={{
          badge: content["learn.explore.badge"]?.markdown,
          title: content["learn.explore.title"]?.markdown,
          description: content["learn.explore.description"]?.markdown,
        }}
      />
    </div>
  );
}
