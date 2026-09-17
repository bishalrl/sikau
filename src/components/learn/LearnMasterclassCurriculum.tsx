import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ModuleSummary = {
  title: string;
  lessons: number;
  duration: string;
};

type Props = {
  courseSlug: string;
  modules: ModuleSummary[];
  includes?: string[];
  priceNpr: number;
  listPrice?: string;
  paymentStatus?: string | null;
  cta?: string;
};

function moneyLabel(priceNpr: number) {
  return priceNpr <= 0 ? "Free" : `NPR ${priceNpr.toLocaleString()}`;
}

function formatMinutes(total: number) {
  if (total <= 0) return "Self-paced";
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function LearnMasterclassCurriculum({
  courseSlug,
  modules,
  includes = [],
  priceNpr,
  listPrice,
  paymentStatus,
  cta = "View course",
}: Props) {
  const approved = paymentStatus === "APPROVED";
  const lessonCount = modules.reduce((sum, module) => sum + module.lessons, 0);

  return (
    <section className="border-y border-outline-variant/30 bg-surface-container-low py-xl">
      <div className="site-container">
        <div className="grid gap-xl lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display-md text-display-md text-on-background">Course curriculum</h2>
            <p className="mt-sm font-body-md text-on-surface-variant">
              {modules.length} modules · {lessonCount} lessons
            </p>

            <div className="mt-lg space-y-sm">
              {modules.map((mod, i) => (
                <Card key={`${mod.title}-${i}`} className="p-md">
                  <div className="flex items-center justify-between gap-md">
                    <div className="flex items-center gap-md">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container/10 text-sm font-bold text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <p className="font-label-md text-on-background">{mod.title}</p>
                        <p className="font-label-sm text-on-surface-variant">
                          {mod.lessons} lessons · {mod.duration}
                        </p>
                      </div>
                    </div>
                    <MaterialIcon name="menu_book" className="text-outline-variant" />
                  </div>
                </Card>
              ))}
              {modules.length === 0 && (
                <p className="text-sm text-on-surface-variant">No modules published for this course yet.</p>
              )}
            </div>
          </div>

          <div>
            <Card className="sticky top-24 p-lg">
              <h3 className="font-headline-md text-on-background">What You&apos;ll Get</h3>
              <ul className="mt-md space-y-sm">
                {(includes.length
                  ? includes
                  : ["Full course access", "Learn at your own pace", "Certificate on completion"]
                ).map((item) => (
                  <li key={item} className="flex items-start gap-sm font-body-md text-on-surface-variant">
                    <MaterialIcon name="check_circle" className="mt-0.5 shrink-0 text-primary" filled />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-lg rounded-xl bg-primary-container/10 p-md">
                <p className="font-label-sm text-on-surface-variant">
                  {priceNpr <= 0 ? "Free to join" : "One-time payment"}
                </p>
                <p className="font-display-md text-display-md font-bold text-primary">
                  {moneyLabel(priceNpr)}
                  {listPrice ? (
                    <span className="ml-2 text-base font-normal text-on-surface-variant line-through">
                      {listPrice}
                    </span>
                  ) : null}
                </p>
              </div>
              {approved ? (
                <Button size="lg" className="mt-md w-full" href={`/study/${courseSlug}`}>
                  Continue Learning
                </Button>
              ) : (
                <Button size="lg" className="mt-md w-full" href={`/learn/${courseSlug}`}>
                  {cta}
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export function summarizeCourseModules(
  modules: Array<{
    title: string;
    lessons: Array<{ durationMins: number }>;
  }>,
): ModuleSummary[] {
  return modules.map((module) => {
    const minutes = module.lessons.reduce((sum, lesson) => sum + (lesson.durationMins || 0), 0);
    return {
      title: module.title,
      lessons: module.lessons.length,
      duration: formatMinutes(minutes),
    };
  });
}
