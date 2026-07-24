import { MaterialIcon } from "./MaterialIcon";

const modules = [
  {
    num: "01",
    title: "Introduction to Financial Freedom",
    meta: "3 Lessons • 45m",
    open: true,
    lessons: [
      { title: "Understanding Wealth Psychology", duration: "15:20" },
      { title: "Income vs Assets: The Real Difference", duration: "12:10" },
      { title: "Setting SMART Financial Goals", duration: "18:05" },
    ],
  },
  {
    num: "02",
    title: "Mastering the SIP Engine",
    meta: "5 Lessons • 1h 15m",
    summary: "Deep dive into mutual fund selection, compounding math, and risk mitigation strategies.",
  },
  {
    num: "03",
    title: "The Insurance Safety Net",
    meta: "4 Lessons • 50m",
    summary: "Choosing between Term and Endowment. Medical insurance hacks for Nepal.",
  },
];

export function CurriculumAccordion() {
  return (
    <section className="bg-surface-container py-xl">
      <div className="mx-auto max-w-3xl px-gutter">
        <div className="reveal active mb-xl text-center">
          <h2 className="font-display-md text-display-md text-on-background">Inside the Masterclass</h2>
          <p className="mt-sm text-on-surface-variant">7 Depth-Packed Modules. No filler content.</p>
        </div>
        <div className="reveal active space-y-md">
          {modules.map((mod) => (
            <details
              key={mod.num}
              className="group overflow-hidden rounded-2xl border border-outline-variant/30 bg-white"
              open={mod.open}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between p-md transition-colors hover:bg-surface-container-low [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-md">
                  <span className="font-bold text-primary">{mod.num}</span>
                  <h4 className="font-label-md">{mod.title}</h4>
                </div>
                <div className="flex items-center gap-sm">
                  <span className="text-xs text-on-surface-variant">{mod.meta}</span>
                  <MaterialIcon name="expand_more" className="transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div className="space-y-sm border-t border-outline-variant/10 px-md pt-md pb-md">
                {mod.lessons ? (
                  mod.lessons.map((lesson) => (
                    <div key={lesson.title} className="flex justify-between text-sm">
                      <span>{lesson.title}</span>
                      <span className="text-on-surface-variant">{lesson.duration}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">{mod.summary}</p>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
