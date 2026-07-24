import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { EnrollButton } from "@/components/learn/EnrollButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { masterclassModules } from "@/lib/data";

const includes = [
  "Lifetime access to all modules",
  "Downloadable worksheets & templates",
  "Private community access",
  "Completion certificate",
  "Monthly live Q&A sessions",
];

type Props = {
  courseSlug?: string;
  paymentStatus?: string | null;
};

export function LearnMasterclassCurriculum({
  courseSlug = "personal-finance-masterclass",
  paymentStatus,
}: Props) {
  const approved = paymentStatus === "APPROVED";

  return (
    <section className="border-y border-outline-variant/30 bg-surface-container-low py-xl">
      <div className="site-container">
        <div className="grid gap-xl lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display-md text-display-md text-on-background">Masterclass Curriculum</h2>
            <p className="mt-sm font-body-md text-on-surface-variant">
              5 modules · 19 lessons · Certificate on completion
            </p>

            <div className="mt-lg space-y-sm">
              {masterclassModules.map((mod, i) => (
                <Card key={mod.title} className="p-md">
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
            </div>
          </div>

          <div>
            <Card className="sticky top-24 p-lg">
              <h3 className="font-headline-md text-on-background">What You&apos;ll Get</h3>
              <ul className="mt-md space-y-sm">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-sm font-body-md text-on-surface-variant">
                    <MaterialIcon name="check_circle" className="mt-0.5 shrink-0 text-primary" filled />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-lg rounded-xl bg-primary-container/10 p-md">
                <p className="font-label-sm text-on-surface-variant">One-time payment</p>
                <p className="font-display-md text-display-md font-bold text-primary">
                  NPR 1,999
                  <span className="ml-2 text-base font-normal text-on-surface-variant line-through">
                    NPR 4,999
                  </span>
                </p>
              </div>
              {approved ? (
                <Button size="lg" className="mt-md w-full" href={`/study/${courseSlug}`}>
                  Continue Learning
                </Button>
              ) : (
                <EnrollButton courseSlug={courseSlug} label="Enroll Now" size="lg" className="mt-md" />
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
