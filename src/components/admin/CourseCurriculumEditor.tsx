"use client";

import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Button } from "@/components/ui/Button";

export type EditorAsset = {
  storagePath: string;
  mimeType: string;
  kind: "VIDEO" | "FILE" | "IMAGE";
  label?: string;
};

export type EditorLesson = {
  key: string;
  title: string;
  titleNe: string;
  slug: string;
  summary: string;
  content: string;
  type: "READING" | "VIDEO" | "QUIZ";
  durationMins: number;
  isPreview: boolean;
  assets: EditorAsset[];
};

export type EditorModule = {
  key: string;
  title: string;
  titleNe: string;
  description: string;
  lessons: EditorLesson[];
};

type Props = {
  modules: EditorModule[];
  onChange: (modules: EditorModule[]) => void;
  message?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function newKey() {
  return crypto.randomUUID();
}

export function createEmptyLesson(partial?: Partial<EditorLesson>): EditorLesson {
  const title = partial?.title ?? "New lesson";
  return {
    key: partial?.key ?? newKey(),
    title,
    titleNe: partial?.titleNe ?? "",
    slug: partial?.slug ?? (slugify(title) || "lesson"),
    summary: partial?.summary ?? "",
    content: partial?.content ?? "## Lesson body\n\nWrite your lesson here.",
    type: partial?.type ?? "READING",
    durationMins: partial?.durationMins ?? 10,
    isPreview: partial?.isPreview ?? false,
    assets: partial?.assets ?? [],
  };
}

export function createEmptyModule(partial?: Partial<EditorModule>): EditorModule {
  return {
    key: partial?.key ?? newKey(),
    title: partial?.title ?? "Module 1",
    titleNe: partial?.titleNe ?? "",
    description: partial?.description ?? "",
    lessons: partial?.lessons?.length ? partial.lessons : [createEmptyLesson({ isPreview: true })],
  };
}

export function CourseCurriculumEditor({ modules, onChange, message }: Props) {
  function updateModule(moduleKey: string, patch: Partial<EditorModule>) {
    onChange(modules.map((module) => (module.key === moduleKey ? { ...module, ...patch } : module)));
  }

  function updateLesson(moduleKey: string, lessonKey: string, patch: Partial<EditorLesson>) {
    onChange(
      modules.map((module) => {
        if (module.key !== moduleKey) return module;
        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.key !== lessonKey) return lesson;
            const next = { ...lesson, ...patch };
            if (patch.title !== undefined && (!lesson.slug || lesson.slug === slugify(lesson.title))) {
              next.slug = slugify(patch.title) || lesson.slug;
            }
            return next;
          }),
        };
      }),
    );
  }

  function moveModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function moveLesson(moduleKey: string, index: number, direction: -1 | 1) {
    onChange(
      modules.map((module) => {
        if (module.key !== moduleKey) return module;
        const target = index + direction;
        if (target < 0 || target >= module.lessons.length) return module;
        const lessons = [...module.lessons];
        const [item] = lessons.splice(index, 1);
        lessons.splice(target, 0, item);
        return { ...module, lessons };
      }),
    );
  }

  async function uploadAsset(moduleKey: string, lessonKey: string, file: File | null) {
    if (!file) return;

    const formData = new FormData();
    formData.append("folder", "course-assets");
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Unable to upload asset.");
    }

    const kind: EditorAsset["kind"] = file.type.startsWith("video/")
      ? "VIDEO"
      : file.type.startsWith("image/")
        ? "IMAGE"
        : "FILE";

    const asset: EditorAsset = {
      storagePath: data.path,
      mimeType: file.type || "application/octet-stream",
      kind,
      label: file.name,
    };

    onChange(
      modules.map((module) => {
        if (module.key !== moduleKey) return module;
        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.key !== lessonKey) return lesson;
            return {
              ...lesson,
              type: kind === "VIDEO" ? "VIDEO" : lesson.type,
              assets: [...lesson.assets, asset],
            };
          }),
        };
      }),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-on-background">Curriculum</h2>
          <p className="text-sm text-on-surface-variant">
            Add modules and lessons visually. Upload videos or files directly onto a lesson.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...modules, createEmptyModule({ title: `Module ${modules.length + 1}` })])}
        >
          Add module
        </Button>
      </div>

      {message && <p className="text-sm text-on-surface-variant">{message}</p>}

      {modules.map((module, moduleIndex) => (
        <article key={module.key} className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid flex-1 gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Module title
                <input
                  value={module.title}
                  onChange={(e) => updateModule(module.key, { title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Module title (Nepali)
                <input
                  value={module.titleNe}
                  onChange={(e) => updateModule(module.key, { titleNe: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => moveModule(moduleIndex, -1)}>
                Up
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => moveModule(moduleIndex, 1)}>
                Down
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange(modules.filter((item) => item.key !== module.key))}
                disabled={modules.length <= 1}
              >
                Remove
              </Button>
            </div>
          </div>

          <label className="mt-3 block text-sm font-medium">
            Module description
            <textarea
              value={module.description}
              onChange={(e) => updateModule(module.key, { description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
            />
          </label>

          <div className="mt-5 space-y-4">
            {module.lessons.map((lesson, lessonIndex) => (
              <div key={lesson.key} className="rounded-2xl border border-outline-variant/30 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">
                    Lesson {lessonIndex + 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveLesson(module.key, lessonIndex, -1)}
                    >
                      Up
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveLesson(module.key, lessonIndex, 1)}
                    >
                      Down
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={module.lessons.length <= 1}
                      onClick={() =>
                        updateModule(module.key, {
                          lessons: module.lessons.filter((item) => item.key !== lesson.key),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Title
                    <input
                      value={lesson.title}
                      onChange={(e) => updateLesson(module.key, lesson.key, { title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Slug
                    <input
                      value={lesson.slug}
                      onChange={(e) => updateLesson(module.key, lesson.key, { slug: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Type
                    <select
                      value={lesson.type}
                      onChange={(e) =>
                        updateLesson(module.key, lesson.key, {
                          type: e.target.value as EditorLesson["type"],
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
                    >
                      <option value="READING">Reading</option>
                      <option value="VIDEO">Video</option>
                      <option value="QUIZ">Quiz</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Duration (minutes)
                    <input
                      type="number"
                      min={1}
                      value={lesson.durationMins}
                      onChange={(e) =>
                        updateLesson(module.key, lesson.key, {
                          durationMins: Number(e.target.value) || 1,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-sm font-medium">
                  Summary
                  <input
                    value={lesson.summary}
                    onChange={(e) => updateLesson(module.key, lesson.key, { summary: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
                  />
                </label>

                <label className="mt-3 inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={lesson.isPreview}
                    onChange={(e) => updateLesson(module.key, lesson.key, { isPreview: e.target.checked })}
                  />
                  Free preview lesson
                </label>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Lesson content</p>
                  <MarkdownEditor
                    value={lesson.content}
                    onChange={(value) => updateLesson(module.key, lesson.key, { content: value })}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Assets</p>
                  {lesson.assets.map((asset, assetIndex) => (
                    <div
                      key={`${asset.storagePath}-${assetIndex}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-sm"
                    >
                      <span>
                        {asset.label ?? asset.kind} · <code>{asset.storagePath}</code>
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateLesson(module.key, lesson.key, {
                            assets: lesson.assets.filter((_, index) => index !== assetIndex),
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <input
                    type="file"
                    accept="video/*,image/*,.pdf,.doc,.docx,.ppt,.pptx,.zip"
                    onChange={async (e) => {
                      try {
                        await uploadAsset(module.key, lesson.key, e.target.files?.[0] ?? null);
                      } catch (error) {
                        console.error(error);
                      } finally {
                        e.target.value = "";
                      }
                    }}
                    className="w-full rounded-xl border border-outline-variant/50 px-4 py-3 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateModule(module.key, {
                  lessons: [...module.lessons, createEmptyLesson({ title: `Lesson ${module.lessons.length + 1}` })],
                })
              }
            >
              Add lesson
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
