/** Shared course/lesson duration helpers. */

export function totalLessonMinutes(
  modules: Array<{ lessons: Array<{ durationMins?: number | null }> }>,
): number {
  return modules.reduce(
    (sum, module) =>
      sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + (lesson.durationMins || 0), 0),
    0,
  );
}

export function formatCourseDuration(totalMinutes: number, lessonCount?: number): string {
  if (totalMinutes > 0) {
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (lessonCount && lessonCount > 0) {
    return `${lessonCount} ${lessonCount === 1 ? "lesson" : "lessons"}`;
  }
  return "Self-paced";
}

/** Legacy UI/API default that was applied to every new lesson. */
export function isPlaceholderLessonDuration(mins: number | null | undefined) {
  return !mins || mins === 10;
}

/**
 * Prefer real summed lesson minutes. If every lesson still has the old
 * static default of 10, fall back to lesson count so courses don't all
 * look like "10 min" / "N0 min".
 */
export function resolveCourseDuration(
  lessons: Array<{ durationMins?: number | null }>,
): string {
  const lessonCount = lessons.length;
  if (!lessonCount) return "Self-paced";

  const allLegacyDefault = lessons.every((lesson) => lesson.durationMins === 10);
  if (allLegacyDefault) {
    return formatCourseDuration(0, lessonCount);
  }

  const total = lessons.reduce((sum, lesson) => sum + (lesson.durationMins || 0), 0);
  return formatCourseDuration(total, lessonCount);
}

export function readVideoDurationMinutes(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("video/")) {
      resolve(0);
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const finish = (minutes: number) => {
      URL.revokeObjectURL(url);
      resolve(minutes);
    };

    video.onloadedmetadata = () => {
      const seconds = video.duration;
      if (!Number.isFinite(seconds) || seconds <= 0) {
        finish(0);
        return;
      }
      finish(Math.max(1, Math.round(seconds / 60)));
    };
    video.onerror = () => finish(0);
    video.src = url;
  });
}
