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
      </div>
      <CourseManager courses={courses} canPublish />
    </section>
  );
}
