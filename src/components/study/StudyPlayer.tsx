"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, PlayCircle } from "lucide-react";
import { LessonCompleteButton } from "@/components/study/LessonCompleteButton";
import { Button } from "@/components/ui/Button";

export type StudyOutlineModule = {
  id: string;
  title: string;
  lessons: Array<{
    id: string;
    slug: string;
    title: string;
    type: string;
    durationMins: number;
    completed: boolean;
  }>;
};

export type StudyLessonView = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  type: string;
  durationMins: number;
  completed: boolean;
  assets: Array<{
    id: string;
    storagePath: string;
    mimeType: string;
    kind: string;
    label: string | null;
  }>;
};

type Props = {
  courseSlug: string;
  courseTitle: string;
  modules: StudyOutlineModule[];
  lesson: StudyLessonView;
  prevSlug: string | null;
  nextSlug: string | null;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
};

function isVideoAsset(asset: StudyLessonView["assets"][number]) {
  return asset.kind === "VIDEO" || asset.mimeType.startsWith("video/");
}

export function StudyPlayer({
  courseSlug,
  courseTitle,
  modules,
  lesson,
  prevSlug,
  nextSlug,
  progressPercent,
  completedCount,
  totalCount,
}: Props) {
  const videoAssets = lesson.assets.filter(isVideoAsset);
  const otherAssets = lesson.assets.filter((asset) => !isVideoAsset(asset));
  const showVideo = lesson.type === "VIDEO" || videoAssets.length > 0;

  return (
    <div className="study-player">
      <aside className="study-player__sidebar">
        <div className="study-player__sidebar-head">
          <Link href={`/study/${courseSlug}`} className="study-player__course-link">
            {courseTitle}
          </Link>
          <div className="study-player__progress-meta">
            <span>{progressPercent}% complete</span>
            <span>
              {completedCount}/{totalCount} lessons
            </span>
          </div>
          <div className="study-player__progress-track">
            <div className="study-player__progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <nav className="study-player__outline" aria-label="Course outline">
          {modules.map((module, index) => (
            <div key={module.id} className="study-player__module">
              <p className="study-player__module-title">
                Week {index + 1}: {module.title}
              </p>
              <ul className="study-player__lesson-list">
                {module.lessons.map((item) => {
                  const active = item.slug === lesson.slug;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/study/${courseSlug}/${item.slug}`}
                        className={`study-player__lesson-link ${active ? "is-active" : ""} ${item.completed ? "is-done" : ""}`}
                      >
                        <span className="study-player__lesson-icon">
                          {item.completed ? (
                            <CheckCircle2 size={16} />
                          ) : item.type === "VIDEO" ? (
                            <PlayCircle size={16} />
                          ) : (
                            <Circle size={16} />
                          )}
                        </span>
                        <span className="study-player__lesson-copy">
                          <span className="study-player__lesson-name">{item.title}</span>
                          <span className="study-player__lesson-meta">
                            {item.type} · {item.durationMins} min
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="study-player__main">
        <header className="study-player__header">
          <p className="study-player__type">{lesson.type}</p>
          <h1 className="study-player__title">{lesson.title}</h1>
          {lesson.summary && <p className="study-player__summary">{lesson.summary}</p>}
        </header>

        {showVideo && (
          <div className="study-player__media">
            {videoAssets.length > 0 ? (
              videoAssets.map((asset) => (
                <video key={asset.id} controls playsInline className="study-player__video" src={asset.storagePath}>
                  <track kind="captions" />
                </video>
              ))
            ) : (
              <div className="study-player__media-empty">
                <p>Video lesson — upload a video asset in the course builder to play it here.</p>
              </div>
            )}
          </div>
        )}

        <article className="study-player__article">
          <div className="study-player__content">
            <ReactMarkdown>{lesson.content?.trim() || "Lesson content coming soon."}</ReactMarkdown>
          </div>

          {otherAssets.length > 0 && (
            <div className="study-player__assets">
              <h2>Resources</h2>
              <ul>
                {otherAssets.map((asset) => (
                  <li key={asset.id}>
                    <a href={asset.storagePath} target="_blank" rel="noreferrer">
                      {asset.label ?? asset.kind}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <footer className="study-player__footer">
          {prevSlug ? (
            <Button variant="outline" href={`/study/${courseSlug}/${prevSlug}`}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          )}

          <LessonCompleteButton lessonId={lesson.id} completed={lesson.completed} />

          {nextSlug ? (
            <Button href={`/study/${courseSlug}/${nextSlug}`}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button href={`/study/${courseSlug}`}>Back to course</Button>
          )}
        </footer>
      </main>
    </div>
  );
}
