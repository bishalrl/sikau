"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CourseCurriculumEditor,
  createEmptyModule,
  type EditorModule,
} from "@/components/admin/CourseCurriculumEditor";
import { Button } from "@/components/ui/Button";

type ManagedCourse = {
  id: string;
  slug: string;
  title: string;
  titleNe: string | null;
  description: string;
  descriptionNe: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED";
  category: string;
  level: string;
  image: string | null;
  coverImage: string | null;
  paymentQrPath: string | null;
  instructorName: string;
  priceNpr: number;
  paymentInstructions: string | null;
  featured: boolean;
  durationText: string | null;
  modules: Array<{
    id: string;
    title: string;
    titleNe: string | null;
    description: string | null;
    lessons: Array<{
      id: string;
      title: string;
      titleNe: string | null;
      slug: string;
      summary: string | null;
      content: string | null;
      type: "READING" | "VIDEO" | "QUIZ";
      durationMins: number;
      isPreview: boolean;
      assets: Array<{
        storagePath: string;
        mimeType: string;
        kind: "VIDEO" | "FILE" | "IMAGE";
        label: string | null;
      }>;
    }>;
  }>;
};

type Props = {
  courses: ManagedCourse[];
  canPublish: boolean;
};

type FormState = {
  id?: string;
  slug: string;
  title: string;
  titleNe: string;
  description: string;
  descriptionNe: string;
  category: string;
  level: string;
  image: string;
  coverImage: string;
  paymentQrPath: string;
  instructorName: string;
  priceNpr: string;
  paymentInstructions: string;
  durationText: string;
  featured: boolean;
  status: string;
};

function emptyForm(canPublish: boolean): FormState {
  return {
    slug: "",
    title: "",
    titleNe: "",
    description: "",
    descriptionNe: "",
    category: "Personal Finance",
    level: "Beginner",
    image: "",
    coverImage: "",
    paymentQrPath: "",
    instructorName: "",
    priceNpr: "0",
    paymentInstructions: "Pay using the QR and upload your receipt for approval.",
    durationText: "",
    featured: false,
    status: canPublish ? "PUBLISHED" : "PENDING_REVIEW",
  };
}

function courseToModules(course: ManagedCourse): EditorModule[] {
  return course.modules.map((module) => ({
    key: module.id,
    title: module.title,
    titleNe: module.titleNe ?? "",
    description: module.description ?? "",
    lessons: module.lessons.map((lesson) => ({
      key: lesson.id,
      title: lesson.title,
      titleNe: lesson.titleNe ?? "",
      slug: lesson.slug,
      summary: lesson.summary ?? "",
      content: lesson.content ?? "",
      type: lesson.type,
      durationMins: lesson.durationMins,
      isPreview: lesson.isPreview,
      assets: lesson.assets.map((asset) => ({
        storagePath: asset.storagePath,
        mimeType: asset.mimeType,
        kind: asset.kind,
        label: asset.label ?? undefined,
      })),
    })),
  }));
}

function modulesForApi(modules: EditorModule[]) {
  return modules.map((module) => ({
    title: module.title,
    titleNe: module.titleNe || undefined,
    description: module.description || undefined,
    lessons: module.lessons.map((lesson) => ({
      title: lesson.title,
      titleNe: lesson.titleNe || undefined,
      slug: lesson.slug,
      summary: lesson.summary || undefined,
      content: lesson.content || undefined,
      type: lesson.type,
      durationMins: lesson.durationMins,
      isPreview: lesson.isPreview,
      assets: lesson.assets.map((asset) => ({
        storagePath: asset.storagePath,
        mimeType: asset.mimeType,
        kind: asset.kind,
        label: asset.label,
      })),
    })),
  }));
}

export function CourseManager({ courses: initialCourses, canPublish }: Props) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<"" | "image" | "coverImage" | "paymentQrPath">("");
  const [form, setForm] = useState<FormState>(emptyForm(canPublish));
  const [modules, setModules] = useState<EditorModule[]>([createEmptyModule()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function resetEditor() {
    setForm(emptyForm(canPublish));
    setModules([createEmptyModule()]);
    setEditingId(null);
    setMessage("");
  }

  function loadCourse(course: ManagedCourse) {
    setEditingId(course.id);
    setForm({
      id: course.id,
      slug: course.slug,
      title: course.title,
      titleNe: course.titleNe ?? "",
      description: course.description,
      descriptionNe: course.descriptionNe ?? "",
      category: course.category,
      level: course.level,
      image: course.image ?? "",
      coverImage: course.coverImage ?? "",
      paymentQrPath: course.paymentQrPath ?? "",
      instructorName: course.instructorName,
      priceNpr: String(course.priceNpr),
      paymentInstructions:
        course.paymentInstructions ?? "Pay using the QR and upload your receipt for approval.",
      durationText: course.durationText ?? "",
      featured: course.featured,
      status: course.status,
    });
    setModules(courseToModules(course));
    setMessage(`Editing “${course.title}”.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (!modules.length || modules.some((module) => module.lessons.length === 0)) {
        throw new Error("Add at least one module with one lesson.");
      }

      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          priceNpr: Number(form.priceNpr),
          modules: modulesForApi(modules),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save course.");
      }

      const savedId = data.course?.id ?? form.id;
      if (savedId) {
        setForm((current) => ({ ...current, id: savedId }));
        setEditingId(savedId);
      }
      setMessage(editingId ? "Course updated." : "Course saved.");
      router.refresh();

      setCourses((current) => {
        const exists = current.some((course) => course.id === savedId || course.slug === form.slug);
        if (exists) {
          return current.map((course) =>
            course.id === savedId || (!savedId && course.slug === form.slug)
              ? {
                  ...course,
                  ...form,
                  id: savedId ?? course.id,
                  titleNe: form.titleNe || null,
                  descriptionNe: form.descriptionNe || null,
                  image: form.image || null,
                  coverImage: form.coverImage || null,
                  paymentQrPath: form.paymentQrPath || null,
                  priceNpr: Number(form.priceNpr),
                  paymentInstructions: form.paymentInstructions,
                  durationText: form.durationText || null,
                  status: form.status as ManagedCourse["status"],
                  modules: modules.map((module) => ({
                    id: module.key,
                    title: module.title,
                    titleNe: module.titleNe || null,
                    description: module.description || null,
                    lessons: module.lessons.map((lesson) => ({
                      id: lesson.key,
                      title: lesson.title,
                      titleNe: lesson.titleNe || null,
                      slug: lesson.slug,
                      summary: lesson.summary || null,
                      content: lesson.content || null,
                      type: lesson.type,
                      durationMins: lesson.durationMins,
                      isPreview: lesson.isPreview,
                      assets: lesson.assets.map((asset) => ({
                        ...asset,
                        label: asset.label ?? null,
                      })),
                    })),
                  })),
                }
              : course,
          );
        }

        return [
          {
            id: savedId ?? form.slug,
            slug: form.slug,
            title: form.title,
            titleNe: form.titleNe || null,
            description: form.description,
            descriptionNe: form.descriptionNe || null,
            status: form.status as ManagedCourse["status"],
            category: form.category,
            level: form.level,
            image: form.image || null,
            coverImage: form.coverImage || null,
            paymentQrPath: form.paymentQrPath || null,
            instructorName: form.instructorName,
            priceNpr: Number(form.priceNpr),
            paymentInstructions: form.paymentInstructions,
            featured: form.featured,
            durationText: form.durationText || null,
            modules: modules.map((module) => ({
              id: module.key,
              title: module.title,
              titleNe: module.titleNe || null,
              description: module.description || null,
              lessons: module.lessons.map((lesson) => ({
                id: lesson.key,
                title: lesson.title,
                titleNe: lesson.titleNe || null,
                slug: lesson.slug,
                summary: lesson.summary || null,
                content: lesson.content || null,
                type: lesson.type,
                durationMins: lesson.durationMins,
                isPreview: lesson.isPreview,
                assets: lesson.assets.map((asset) => ({
                  ...asset,
                  label: asset.label ?? null,
                })),
              })),
            })),
          },
          ...current,
        ];
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save course.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCourse(course: ManagedCourse) {
    const confirmed = window.confirm(
      `Delete “${course.title}”? Lessons, enrollments, and payments for this course will be removed.`,
    );
    if (!confirmed) return;

    setDeletingId(course.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete course.");
      }

      setCourses((current) => current.filter((item) => item.id !== course.id));
      if (editingId === course.id) resetEditor();
      setMessage(`Deleted “${course.title}”.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete course.");
    } finally {
      setDeletingId(null);
    }
  }

  async function uploadImage(
    file: File | null,
    field: "image" | "coverImage" | "paymentQrPath",
    folder: "blog-covers" | "payment-qr",
  ) {
    if (!file) return;
    setUploadingField(field);
    setMessage("");

    const formData = new FormData();
    formData.append("folder", folder);
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploadingField("");

    if (!response.ok) {
      setMessage(data.error ?? "Unable to upload image.");
      return;
    }

    setForm((current) => ({ ...current, [field]: data.path }));
    setMessage("Image uploaded.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          {editingId ? `Editing ${form.title || form.slug}` : "Create a new course, or edit one below."}
        </p>
        {editingId && (
          <Button type="button" variant="outline" size="sm" onClick={resetEditor}>
            New course
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {courses.map((course) => (
          <article
            key={course.id}
            className={`rounded-3xl border p-5 transition ${
              editingId === course.id
                ? "border-primary bg-primary-container/10"
                : "border-outline-variant/30 bg-white"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{course.status}</p>
            <h3 className="mt-2 font-headline-md text-on-background">{course.title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {course.category} · {course.level}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              NPR {course.priceNpr} · /study/{course.slug}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {course.modules.length} modules ·{" "}
              {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)} lessons
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => loadCourse(course)}>
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-700 hover:bg-red-50"
                disabled={deletingId === course.id}
                onClick={() => deleteCourse(course)}
              >
                {deletingId === course.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-outline-variant/30 bg-white p-6">
        <div>
          <h2 className="font-headline-md text-on-background">
            {editingId ? "Edit course details" : "Create course"}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Fill course info, then build the syllabus with modules and lessons.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
          <Input label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Input label="Title (Nepali)" value={form.titleNe} onChange={(value) => setForm({ ...form, titleNe: value })} />
          <Input
            label="Instructor Name"
            value={form.instructorName}
            onChange={(value) => setForm({ ...form, instructorName: value })}
          />
          <Input label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
          <Input label="Level" value={form.level} onChange={(value) => setForm({ ...form, level: value })} />
          <Input label="Price (NPR)" value={form.priceNpr} onChange={(value) => setForm({ ...form, priceNpr: value })} />
          <Input
            label="Duration Text"
            value={form.durationText}
            onChange={(value) => setForm({ ...form, durationText: value })}
          />
        </div>

        <label className="block text-sm font-medium text-on-background">
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            required
          />
        </label>

        <label className="block text-sm font-medium text-on-background">
          Description (Nepali)
          <textarea
            value={form.descriptionNe}
            onChange={(e) => setForm({ ...form, descriptionNe: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <ImagePicker
            label="Course image"
            path={form.image}
            uploading={uploadingField === "image"}
            onFile={(file) => void uploadImage(file, "image", "blog-covers")}
          />
          <ImagePicker
            label="Cover image"
            path={form.coverImage}
            uploading={uploadingField === "coverImage"}
            onFile={(file) => void uploadImage(file, "coverImage", "blog-covers")}
          />
          <ImagePicker
            label="Payment QR"
            path={form.paymentQrPath}
            uploading={uploadingField === "paymentQrPath"}
            onFile={(file) => void uploadImage(file, "paymentQrPath", "payment-qr")}
          />
        </div>

        <label className="block text-sm font-medium text-on-background">
          Payment Instructions
          <textarea
            value={form.paymentInstructions}
            onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          />
        </label>

        <CourseCurriculumEditor modules={modules} onChange={setModules} />

        <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/30 pt-4">
          <label className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured course
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            {canPublish && <option value="PUBLISHED">Published</option>}
          </select>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Update course" : "Save course"}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              disabled={deletingId === editingId}
              onClick={() => {
                const course = courses.find((item) => item.id === editingId);
                if (course) deleteCourse(course);
              }}
            >
              {deletingId === editingId ? "Deleting..." : "Delete course"}
            </Button>
          )}
          {message && <p className="text-sm text-on-surface-variant">{message}</p>}
        </div>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-on-background">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
      />
    </label>
  );
}

function ImagePicker({
  label,
  path,
  uploading,
  onFile,
}: {
  label: string;
  path: string;
  uploading: boolean;
  onFile: (file: File | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-3">
      <p className="text-sm font-medium text-on-background">{label}</p>
      {path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={path} alt="" className="mt-2 h-28 w-full rounded-xl bg-white object-contain" />
      ) : (
        <p className="mt-2 text-xs text-on-surface-variant">No image yet. Choose a file — don’t paste a URL.</p>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className="mt-2 w-full text-sm"
      />
      {uploading && <p className="mt-1 text-xs text-primary">Uploading…</p>}
    </div>
  );
}
