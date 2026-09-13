import { CourseManager } from "@/components/admin/CourseManager";
import { getManageableCourses } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function AdminCoursesPage() {
  const session = await getCurrentSession();
  const courses = await getManageableCourses(session?.user);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Courses</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Upload, Review, Publish</h1>
        <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
          Edit a course below, then click Update course. Delete removes the course, its lessons, and
          enrollments. Save with status <strong>Published</strong> to show it on `/learn` and open it at
          `/study/your-slug`. Include at least one module with one lesson.
        </p>
      </div>
      <CourseManager courses={courses} canPublish />
    </section>
  );
}
