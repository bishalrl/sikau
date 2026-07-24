import {
  ArrowUpRight,
  BookOpen,
  Flame,
  Radio,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DashboardLiveSection } from "@/components/dashboard/DashboardLiveSection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  getDashboardData,
  getUnlockedEbooks,
  getUpcomingLiveSessions,
  getWebsiteContentMap,
  userHasDashboardAccess,
} from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    return null;
  }

  const hasAccess = await userHasDashboardAccess(session.user.id, session.user.role);

  if (!hasAccess) {
    return (
      <div className="site-container py-xl">
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <Badge variant="emerald" className="mb-3">
            Dashboard locked
          </Badge>
          <h1 className="font-display-md text-display-md text-on-background">Enroll to unlock your panel</h1>
          <p className="mt-3 text-on-surface-variant">
            Your dashboard opens after you enroll in a course or unlock an ebook. Then you can study, read, and join
            live sessions.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/learn">Browse courses</Button>
            <Button href="/ebooks" variant="outline">
              View ebook offers
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const [{ stats: dashboardStats, courses, recentActivity }, content, liveSessions, ebooks] = await Promise.all([
    getDashboardData(session.user),
    getWebsiteContentMap(),
    getUpcomingLiveSessions(),
    getUnlockedEbooks(session.user.id),
  ]);
  const inProgress = courses.filter((c) => c.progress !== undefined && c.progress < 100);

  return (
    <div className="site-container py-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge variant="emerald" className="mb-2">
            {content["dashboard.hero.badge"]?.markdown ?? "Your Dashboard"}
          </Badge>
          <h1 className="font-display-md text-display-md text-on-background">
            {content["dashboard.hero.title"]?.markdown ?? `Welcome back, ${session.user.name ?? "Learner"}!`}
          </h1>
          <p className="mt-xs font-body-md text-on-surface-variant">
            {content["dashboard.hero.description"]?.markdown ??
              "Continue courses, read your ebooks, and join live sessions when they go on air."}
          </p>
        </div>
        <Button href="/quiz">
          <Zap className="h-4 w-4" />
          Daily Quiz
        </Button>
      </div>

      <div className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Day Streak", value: dashboardStats.streak, icon: Flame, color: "text-orange-500" },
          { label: "Total XP", value: dashboardStats.xp.toLocaleString(), icon: Zap, color: "text-gold-500" },
          { label: "Level", value: dashboardStats.level, icon: Trophy, color: "text-primary" },
          { label: "Quiz Score", value: `${dashboardStats.quizScore}%`, icon: Target, color: "text-blue-500" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-sm text-on-surface-variant">{stat.label}</p>
                <p className="mt-xs font-headline-md text-on-background">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-lg grid gap-xl lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              <h2 className="font-headline-md text-on-background">Live sessions</h2>
            </div>
            <DashboardLiveSection sessions={liveSessions} />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-on-background">Courses In Progress</h2>
              <Button variant="ghost" size="sm" href="/learn">
                View all <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-5 space-y-4">
              {inProgress.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-label-md text-on-background">{course.title}</p>
                    <p className="font-label-sm text-on-surface-variant">{course.lessons} lessons</p>
                    <ProgressBar value={course.progress ?? 0} size="sm" className="mt-2" />
                  </div>
                  <Button size="sm" href={`/study/${course.slug}`}>
                    {course.progress ? `${course.progress}%` : "Open"}
                  </Button>
                </div>
              ))}
              {inProgress.length === 0 && (
                <p className="text-sm text-on-surface-variant">No approved courses in progress yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-on-background">Ebook reading</h2>
              <Button variant="ghost" size="sm" href="/ebooks">
                All ebooks <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {ebooks.map((ebook) => (
                <Link
                  key={ebook.id}
                  href={`/ebooks/${ebook.slug}/read`}
                  className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low transition hover:border-primary/40"
                >
                  <div className="relative h-36 bg-surface-container">
                    {ebook.coverImage && (
                      <Image src={ebook.coverImage} alt={ebook.title} fill className="object-cover" sizes="300px" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-label-md text-on-background">{ebook.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{ebook.description}</p>
                    <p className="mt-3 text-sm font-semibold text-primary">Continue reading</p>
                  </div>
                </Link>
              ))}
              {ebooks.length === 0 && (
                <p className="text-sm text-on-surface-variant sm:col-span-2">
                  No unlocked ebooks yet. Purchase a guide to read here.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-headline-md text-on-background">Recent Activity</h2>
            <div className="mt-5 space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.action}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-body-md text-on-background">{item.action}</p>
                    <p className="font-label-sm text-on-surface-variant">{item.time}</p>
                  </div>
                  <Badge variant="emerald">{item.xp}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-headline-md text-on-background">Level Progress</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/10 text-2xl font-bold text-primary">
                {dashboardStats.level}
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface-variant">
                  {dashboardStats.xp} / 3,500 XP to Level {dashboardStats.level + 1}
                </p>
                <ProgressBar value={81} className="mt-2" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-headline-md text-on-background">Achievements</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {["🔥", "📚", "💰", "🏆", "⭐", "🎯"].map((emoji, i) => (
                <div
                  key={emoji}
                  className={`flex h-14 items-center justify-center rounded-xl text-2xl ${
                    i < 4 ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-surface-container opacity-40"
                  }`}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
