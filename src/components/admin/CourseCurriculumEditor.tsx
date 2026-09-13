"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Plus, Trash2, Video } from "lucide-react";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Button } from "@/components/ui/Button";
import { uploadCourseAssetToR2 } from "@/lib/r2-browser-upload";

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
  const title = partial?.title ?? "";
  return {
    key: partial?.key ?? newKey(),
    title,
    titleNe: partial?.titleNe ?? "",
    slug: partial?.slug ?? (slugify(title) || "lesson"),
    summary: partial?.summary ?? "",
    content: partial?.content ?? "",
    type: partial?.type ?? "VIDEO",
    durationMins: partial?.durationMins ?? 10,
    isPreview: partial?.isPreview ?? false,
    assets: partial?.assets ?? [],
  };
}

export function createEmptyModule(partial?: Partial<EditorModule>): EditorModule {
  return {
    key: partial?.key ?? newKey(),
    title: partial?.title ?? "",
    titleNe: partial?.titleNe ?? "",
    description: partial?.description ?? "",
    lessons: partial?.lessons?.length ? partial.lessons : [createEmptyLesson()],
  };
}

function isVideoAsset(asset: EditorAsset) {
  return asset.kind === "VIDEO" || asset.mimeType.startsWith("video/");
}

function lessonHasVideo(lesson: EditorLesson) {
  return lesson.assets.some(isVideoAsset);
}

export function CourseCurriculumEditor({ modules, onChange, message }: Props) {
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [uploadKey, setUploadKey] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState("");

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
              next.slug = slugify(patch.title) || lesson.slug || "lesson";
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

    setUploadKey(lessonKey);
    setUploadPercent(0);
    setUploadError("");
    try {
      const uploaded = await uploadCourseAssetToR2(file, (percent) => {
        setUploadPercent(percent);
      });

      const kind: EditorAsset["kind"] = file.type.startsWith("video/")
        ? "VIDEO"
        : file.type.startsWith("image/")
          ? "IMAGE"
          : "FILE";

      const asset: EditorAsset = {
        storagePath: uploaded.storagePath,
        mimeType: uploaded.mimeType,
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
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
      throw error;
    } finally {
      setUploadKey("");
    }
  }

  const lessonCount = modules.reduce((sum, module) => sum + module.lessons.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-on-background">Lessons</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"} in {modules.length}{" "}
            {modules.length === 1 ? "section" : "sections"}. Add a video, or leave notes if there is no video.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const module = createEmptyModule({ title: `Section ${modules.length + 1}` });
            onChange([...modules, module]);
            setOpenLesson(module.lessons[0]?.key ?? null);
          }}
        >
          <Plus size={16} />
          Add section
        </Button>
      </div>

      {message && <p className="text-sm text-on-surface-variant">{message}</p>}
      {uploadError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</p>}

      {modules.map((module, moduleIndex) => (
        <article key={module.key} className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/20 bg-surface-container-low/70 px-4 py-3">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary">
              {moduleIndex + 1}
            </span>
            <input
              value={module.title}
              onChange={(event) => updateModule(module.key, { title: event.target.value })}
              placeholder="Section name, e.g. Getting started"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-on-background outline-none placeholder:font-normal placeholder:text-on-surface-variant"
            />
            <button
              type="button"
              className="rounded-lg p-2 text-on-surface-variant hover:bg-white"
              onClick={() => moveModule(moduleIndex, -1)}
              aria-label="Move section up"
              disabled={moduleIndex === 0}
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-on-surface-variant hover:bg-white"
              onClick={() => moveModule(moduleIndex, 1)}
              aria-label="Move section down"
              disabled={moduleIndex === modules.length - 1}
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
              disabled={modules.length <= 1}
              aria-label="Remove section"
              onClick={() => {
                if (!window.confirm("Remove this section and its lessons?")) return;
                onChange(modules.filter((item) => item.key !== module.key));
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="space-y-2 p-3">
            {module.lessons.map((lesson, lessonIndex) => {
              const open = openLesson === lesson.key;
              const hasVideo = lessonHasVideo(lesson);
              return (
                <div key={lesson.key} className="rounded-2xl border border-outline-variant/25">
                  <button
                    type="button"
                    onClick={() => setOpenLesson(open ? null : lesson.key)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-sm font-semibold text-on-surface-variant">
                      {lessonIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-on-background">
                        {lesson.title || "Untitled lesson"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-on-surface-variant">
                        {hasVideo ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Video size={12} /> Video ready
                          </span>
                        ) : (
                          <span>No video yet</span>
                        )}
                        {lesson.isPreview && <span>· Free preview</span>}
                      </span>
                    </span>
                    <ChevronDown size={16} className={`shrink-0 text-on-surface-variant ${open ? "rotate-180" : ""}`} />
                  </button>

                  {open && (
                    <div className="space-y-4 border-t border-outline-variant/20 px-4 py-4">
                      <input
                        value={lesson.title}
                        onChange={(event) => updateLesson(module.key, lesson.key, { title: event.target.value })}
                        placeholder="Lesson title"
                        className="w-full rounded-xl border border-outline-variant/50 px-4 py-3 text-sm"
                      />

                      <LessonVideoUpload
                        assets={lesson.assets}
                        uploading={uploadKey === lesson.key}
                        percent={uploadPercent}
                        onUpload={(file) => uploadAsset(module.key, lesson.key, file)}
                        onRemove={(index) =>
                          updateLesson(module.key, lesson.key, {
                            assets: lesson.assets.filter((_, assetIndex) => assetIndex !== index),
                          })
                        }
                      />

                      <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <input
                          type="checkbox"
                          checked={lesson.isPreview}
                          onChange={(event) =>
                            updateLesson(module.key, lesson.key, { isPreview: event.target.checked })
                          }
                        />
                        Let anyone watch this lesson before they pay
                      </label>

                      <button
                        type="button"
                        className="text-sm font-medium text-primary"
                        onClick={() =>
                          setShowDetails((current) => ({ ...current, [lesson.key]: !current[lesson.key] }))
                        }
                      >
                        {showDetails[lesson.key] ? "Hide extra details" : "Add notes, a PDF, or change the type"}
                      </button>

                      {showDetails[lesson.key] && (
                        <div className="space-y-3 rounded-2xl bg-surface-container-low/60 p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-sm font-medium">
                              Students do
                              <select
                                value={lesson.type}
                                onChange={(event) =>
                                  updateLesson(module.key, lesson.key, {
                                    type: event.target.value as EditorLesson["type"],
                                  })
                                }
                                className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-3 py-2.5"
                              >
                                <option value="VIDEO">Watch a video</option>
                                <option value="READING">Read notes</option>
                                <option value="QUIZ">Take a quiz</option>
                              </select>
                            </label>
                            <label className="block text-sm font-medium">
                              Length (minutes)
                              <input
                                type="number"
                                min={1}
                                value={lesson.durationMins}
                                onChange={(event) =>
                                  updateLesson(module.key, lesson.key, {
                                    durationMins: Number(event.target.value) || 1,
                                  })
                                }
                                className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-3 py-2.5"
                              />
                            </label>
                          </div>
                          <label className="block text-sm font-medium">
                            Short summary
                            <input
                              value={lesson.summary}
                              onChange={(event) =>
                                updateLesson(module.key, lesson.key, { summary: event.target.value })
                              }
                              placeholder="One line students see before they start"
                              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-3 py-2.5"
                            />
                          </label>
                          <div>
                            <p className="mb-2 text-sm font-medium">Written notes</p>
                            <MarkdownEditor
                              value={lesson.content}
                              onChange={(value) => updateLesson(module.key, lesson.key, { content: value })}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => moveLesson(module.key, lessonIndex, -1)}>
                          Move up
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => moveLesson(module.key, lessonIndex, 1)}>
                          Move down
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-700 hover:bg-red-50"
                          disabled={module.lessons.length <= 1}
                          onClick={() => {
                            if (!window.confirm("Remove this lesson?")) return;
                            updateModule(module.key, {
                              lessons: module.lessons.filter((item) => item.key !== lesson.key),
                            });
                          }}
                        >
                          Remove lesson
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-3 pb-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const lesson = createEmptyLesson({ title: "" });
                updateModule(module.key, { lessons: [...module.lessons, lesson] });
                setOpenLesson(lesson.key);
              }}
            >
              <Plus size={14} />
              Add lesson
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function LessonVideoUpload({
  assets,
  uploading,
  percent,
  onUpload,
  onRemove,
}: {
  assets: EditorAsset[];
  uploading: boolean;
  percent: number;
  onUpload: (file: File | null) => Promise<void>;
  onRemove: (index: number) => void;
}) {
  const videos = assets.map((asset, index) => ({ asset, index })).filter((item) => isVideoAsset(item.asset));
  const files = assets.map((asset, index) => ({ asset, index })).filter((item) => !isVideoAsset(item.asset));
  const [preview, setPreview] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    for (const { asset } of videos) {
      if (preview[asset.storagePath]) continue;
      if (!asset.storagePath.startsWith("r2:")) {
        setPreview((current) => ({ ...current, [asset.storagePath]: asset.storagePath }));
        continue;
      }
      void fetch("/api/upload/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", storagePath: asset.storagePath }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!cancelled && data.url) {
            setPreview((current) => ({ ...current, [asset.storagePath]: data.url as string }));
          }
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
    // preview map is filled inside the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  return (
    <div className="space-y-3">
      {videos.map(({ asset, index }) => (
        <div key={`${asset.storagePath}-${index}`} className="overflow-hidden rounded-2xl border border-outline-variant/30">
          {preview[asset.storagePath] ? (
            <video controls playsInline className="max-h-56 w-full bg-black" src={preview[asset.storagePath]} />
          ) : (
            <p className="px-4 py-6 text-sm text-on-surface-variant">Loading video…</p>
          )}
          <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className="truncate font-medium">{asset.label || "Uploaded video"}</span>
            <button type="button" className="text-red-700" onClick={() => onRemove(index)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-primary/40 bg-primary-container/5 px-4 py-6 text-center">
        <Video size={22} className="text-primary" />
        <span className="mt-2 text-sm font-semibold text-on-background">
          {videos.length ? "Add another video" : "Upload lesson video"}
        </span>
        <span className="mt-1 text-xs text-on-surface-variant">
          Choose a file. Large videos (2–3 GB) upload in the background. No link needed.
        </span>
        <input
          type="file"
          accept="video/*"
          disabled={uploading}
          className="sr-only"
          onChange={async (event) => {
            try {
              await onUpload(event.target.files?.[0] ?? null);
            } catch {
              // Parent shows the error.
            } finally {
              event.target.value = "";
            }
          }}
        />
      </label>
      {uploading && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-sm font-medium text-primary">Uploading… {percent}%</p>
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary">
        <FileText size={14} />
        Add a PDF or image
        <input
          type="file"
          accept="image/*,.pdf"
          disabled={uploading}
          className="sr-only"
          onChange={async (event) => {
            try {
              await onUpload(event.target.files?.[0] ?? null);
            } catch {
              // Parent shows the error.
            } finally {
              event.target.value = "";
            }
          }}
        />
      </label>
      {files.map(({ asset, index }) => (
        <div key={`${asset.storagePath}-${index}`} className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate">{asset.label || "Attached file"}</span>
          <button type="button" className="text-red-700" onClick={() => onRemove(index)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
