import { redirect } from "next/navigation";
import { CourseManager } from "@/components/admin/CourseManager";
import { getManageableCourses } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function InstructorPage() {
  const session = await getCurrentSession();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    redirect("/login");
  }

  const courses = await getManageableCourses(session.user);

  return (
    <div className="site-container py-xl">
      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Instructor Workspace</p>
          <h1 className="mt-2 font-display-md text-display-md text-on-background">Your courses</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Create a course, add lessons with video, then send it for review.
          </p>
        </div>
        <CourseManager courses={courses} canPublish={session.user.role === "ADMIN"} />
      </section>
    </div>
  );
}
