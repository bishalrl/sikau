"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
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

const CATEGORIES = ["Personal Finance", "Investing", "NEPSE", "Business", "Mindset"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const STEPS = [
  { id: 1, label: "About" },
  { id: 2, label: "Lessons" },
  { id: 3, label: "Publish" },
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

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
    title: module.title.trim() || "Section",
    titleNe: module.titleNe || undefined,
    description: module.description || undefined,
    lessons: module.lessons.map((lesson, index) => ({
      title: lesson.title.trim() || `Lesson ${index + 1}`,
      titleNe: lesson.titleNe || undefined,
      slug: lesson.slug || slugify(lesson.title) || `lesson-${index + 1}`,
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

function lessonCount(course: { modules: Array<{ lessons: unknown[] }> }) {
  return course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "Live";
  if (status === "PENDING_REVIEW") return "In review";
  return "Draft";
}

export function CourseManager({ courses: initialCourses, canPublish }: Props) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<"" | "cover" | "paymentQrPath">("");
  const [form, setForm] = useState<FormState>(emptyForm(canPublish));
  const [modules, setModules] = useState<EditorModule[]>([createEmptyModule()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [screen, setScreen] = useState<"list" | "editor">("list");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [slugTouched, setSlugTouched] = useState(false);
  const [showNepali, setShowNepali] = useState(false);
  const [isFree, setIsFree] = useState(true);

  function note(text: string, tone: "ok" | "error" = "ok") {
    setMessage(text);
    setMessageTone(tone);
  }

  function resetEditor() {
    setForm(emptyForm(canPublish));
    setModules([createEmptyModule()]);
    setEditingId(null);
    setSlugTouched(false);
    setShowNepali(false);
    setIsFree(true);
    setStep(1);
    setScreen("list");
    setMessage("");
  }

  function startNew() {
    setForm(emptyForm(canPublish));
    setModules([createEmptyModule({ title: "Getting started" })]);
    setEditingId(null);
    setSlugTouched(false);
    setShowNepali(false);
    setIsFree(true);
    setStep(1);
    setScreen("editor");
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
    setSlugTouched(true);
    setShowNepali(Boolean(course.titleNe || course.descriptionNe));
    setIsFree(course.priceNpr === 0);
    setStep(1);
    setScreen("editor");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setTitle(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: slugTouched ? current.slug : slugify(title),
    }));
  }

  function goNext() {
    if (step === 1) {
      if (!form.title.trim() || !form.description.trim() || !form.instructorName.trim()) {
        note("Add a title, a short description, and your name to continue.", "error");
        return;
      }
      if (!isFree && !(Number(form.priceNpr) > 0)) {
        note("Add a price in NPR, or mark the course as free.", "error");
        return;
      }
      if (!form.slug.trim()) {
        setForm((current) => ({ ...current, slug: slugify(current.title) || "course" }));
      }
    }
    if (step === 2) {
      if (!modules.length || modules.some((module) => module.lessons.length === 0)) {
        note("Add at least one lesson before publishing.", "error");
        return;
      }
    }
    setMessage("");
    setStep((current) => (current === 1 ? 2 : 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setMessage("");

    try {
      if (!form.title.trim() || !form.description.trim() || !form.instructorName.trim()) {
        setStep(1);
        throw new Error("Add a title, a short description, and your name.");
      }
      if (!isFree && !(Number(form.priceNpr) > 0)) {
        setStep(1);
        throw new Error("Add a price in NPR, or mark the course as free.");
      }
      if (!modules.length || modules.some((module) => module.lessons.length === 0)) {
        setStep(2);
        throw new Error("Add at least one section with one lesson.");
      }

      const minutes = modules.reduce(
        (sum, module) => sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + (lesson.durationMins || 0), 0),
        0,
      );
      const priceNpr = isFree ? 0 : Number(form.priceNpr) || 0;
      const slug = form.slug.trim() || slugify(form.title) || "course";

      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug,
          priceNpr,
          durationText: form.durationText || (minutes ? `${minutes} min` : undefined),
          modules: modulesForApi(modules),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save course.");
      }

      const savedId = data.course?.id ?? form.id;
      const savedStatus = form.status as ManagedCourse["status"];
      const nextCourse: ManagedCourse = {
        id: savedId ?? slug,
        slug,
        title: form.title,
        titleNe: form.titleNe || null,
        description: form.description,
        descriptionNe: form.descriptionNe || null,
        status: savedStatus,
        category: form.category,
        level: form.level,
        image: form.image || null,
        coverImage: form.coverImage || null,
        paymentQrPath: form.paymentQrPath || null,
        instructorName: form.instructorName,
        priceNpr,
        paymentInstructions: form.paymentInstructions,
        featured: form.featured,
        durationText: form.durationText || (minutes ? `${minutes} min` : null),
        modules: modules.map((module) => ({
          id: module.key,
          title: module.title,
          titleNe: module.titleNe || null,
          description: module.description || null,
          lessons: module.lessons.map((lesson, index) => ({
            id: lesson.key,
            title: lesson.title,
            titleNe: lesson.titleNe || null,
            slug: lesson.slug || `lesson-${index + 1}`,
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
      };

      setCourses((current) => {
        const exists = current.some((course) => course.id === savedId || course.slug === slug);
        if (!exists) return [nextCourse, ...current];
        return current.map((course) => (course.id === savedId || course.slug === form.slug ? nextCourse : course));
      });
      if (savedId) {
        setForm((current) => ({ ...current, id: savedId, slug }));
        setEditingId(savedId);
      }
      note(savedStatus === "PUBLISHED" ? "Course is live." : "Course saved.");
      router.refresh();
    } catch (error) {
      note(error instanceof Error ? error.message : "Unable to save course.", "error");
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
      note(`Deleted “${course.title}”.`);
      router.refresh();
    } catch (error) {
      note(error instanceof Error ? error.message : "Unable to delete course.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function uploadImage(file: File | null, field: "cover" | "paymentQrPath") {
    if (!file) return;
    setUploadingField(field);
    setMessage("");

    const formData = new FormData();
    formData.append("folder", field === "cover" ? "blog-covers" : "payment-qr");
    formData.append("file", file);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    setUploadingField("");

    if (!response.ok) {
      note(data.error ?? "Unable to upload image.", "error");
      return;
    }

    if (field === "cover") {
      setForm((current) => ({ ...current, image: data.path, coverImage: data.path }));
    } else {
      setForm((current) => ({ ...current, paymentQrPath: data.path }));
    }
    note("Image uploaded.");
  }

  const cover = form.image || form.coverImage;
  const paid = !isFree && Number(form.priceNpr) > 0;

  if (screen === "list") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </p>
          <Button type="button" onClick={startNew}>
            <Plus size={16} />
            New course
          </Button>
        </div>

        {message && <Banner tone={messageTone}>{message}</Banner>}

        {courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-outline-variant/50 bg-white px-6 py-14 text-center">
            <p className="font-headline-md text-on-background">No courses yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-on-surface-variant">
              Start with a title and cover, add your lessons, then publish.
            </p>
            <Button type="button" className="mt-5" onClick={startNew}>
              Create your first course
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const thumb = course.image || course.coverImage;
              return (
                <article key={course.id} className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-white">
                  <div className="relative aspect-[16/9] bg-surface-container">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">No cover</div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary">
                      {statusLabel(course.status)}
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="font-headline-md text-on-background">{course.title}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {course.priceNpr === 0 ? "Free" : `NPR ${course.priceNpr}`} · {lessonCount(course)} lessons
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" className="flex-1" onClick={() => loadCourse(course)}>
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
                        {deletingId === course.id ? "…" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={resetEditor} className="text-sm font-medium text-primary">
          ← All courses
        </button>
        <p className="text-sm text-on-surface-variant">{editingId ? "Editing course" : "New course"}</p>
      </div>

      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setStep(item.id)}
              className={`w-full rounded-2xl px-3 py-2 text-left text-sm ${
                step === item.id ? "bg-primary text-white" : "bg-white text-on-surface-variant"
              }`}
            >
              <span className="block text-xs opacity-80">{item.id}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ol>

      {message && <Banner tone={messageTone}>{message}</Banner>}

      {step === 1 && (
        <section className="space-y-5 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
          <div>
            <h2 className="font-headline-md text-on-background">What is this course?</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Students see the title, cover, and price first.</p>
          </div>

          <label className="block text-sm font-medium">
            Course title
            <input
              value={form.title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Money basics for beginners"
              className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
            />
          </label>

          <label className="block text-sm font-medium">
            Short description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={4}
              placeholder="What will students be able to do after this course?"
              className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
            />
          </label>

          <CoverPicker path={cover} uploading={uploadingField === "cover"} onFile={(file) => void uploadImage(file, "cover")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Your name
              <input
                value={form.instructorName}
                onChange={(event) => setForm({ ...form, instructorName: event.target.value })}
                placeholder="Shown as the instructor"
                className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
              />
            </label>
            <div>
              <p className="text-sm font-medium">Price</p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFree(true);
                    setForm({ ...form, priceNpr: "0" });
                  }}
                  className={`rounded-xl px-4 py-3 text-sm ${isFree ? "bg-primary text-white" : "border border-outline-variant/50"}`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`rounded-xl px-4 py-3 text-sm ${!isFree ? "bg-primary text-white" : "border border-outline-variant/50"}`}
                >
                  Paid
                </button>
              </div>
              {!isFree && (
                <label className="mt-2 block text-sm">
                  NPR
                  <input
                    inputMode="numeric"
                    value={form.priceNpr === "0" ? "" : form.priceNpr}
                    onChange={(event) => setForm({ ...form, priceNpr: event.target.value.replace(/[^\d]/g, "") })}
                    placeholder="999"
                    className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
                  />
                </label>
              )}
            </div>
          </div>

          <ChipGroup
            label="Category"
            options={CATEGORIES.includes(form.category) ? CATEGORIES : [...CATEGORIES, form.category]}
            value={form.category}
            onChange={(category) => setForm({ ...form, category })}
          />
          <label className="block text-sm font-medium">
            Or type a category
            <input
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
            />
          </label>
          <ChipGroup label="Level" options={LEVELS} value={form.level} onChange={(level) => setForm({ ...form, level })} />

          <button type="button" className="text-sm font-medium text-primary" onClick={() => setShowNepali((value) => !value)}>
            {showNepali ? "Hide Nepali text" : "Add Nepali title and description"}
          </button>
          {showNepali && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Title in Nepali
                <input
                  value={form.titleNe}
                  onChange={(event) => setForm({ ...form, titleNe: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Description in Nepali
                <textarea
                  value={form.descriptionNe}
                  onChange={(event) => setForm({ ...form, descriptionNe: event.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 px-4 py-3"
                />
              </label>
            </div>
          )}
        </section>
      )}

      {step === 2 && <CourseCurriculumEditor key={editingId ?? "new"} modules={modules} onChange={setModules} />}

      {step === 3 && (
        <section className="space-y-5 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
          <div>
            <h2 className="font-headline-md text-on-background">Ready to publish?</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {form.title || "This course"} · {lessonCount({ modules })} lessons · {paid ? `NPR ${form.priceNpr}` : "Free"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(canPublish
              ? [
                  { value: "DRAFT", title: "Keep as draft", detail: "Only you can see it." },
                  { value: "PENDING_REVIEW", title: "In review", detail: "Not public yet." },
                  { value: "PUBLISHED", title: "Publish", detail: "Show it on the learn page." },
                ]
              : [{ value: "PENDING_REVIEW", title: "Send for review", detail: "An admin will publish it." }]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm({ ...form, status: option.value })}
                className={`rounded-2xl border p-4 text-left ${
                  form.status === option.value ? "border-primary bg-primary-container/10" : "border-outline-variant/30"
                }`}
              >
                <span className="block font-semibold">{option.title}</span>
                <span className="mt-1 block text-sm text-on-surface-variant">{option.detail}</span>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => setForm({ ...form, featured: event.target.checked })}
            />
            Feature this course on the homepage
          </label>

          {paid && (
            <div className="space-y-3 rounded-2xl bg-surface-container-low/70 p-4">
              <p className="text-sm font-semibold">Payment</p>
              <p className="text-sm text-on-surface-variant">Students pay, then upload a receipt. Add your QR so they know where to send the money.</p>
              <CoverPicker
                path={form.paymentQrPath}
                uploading={uploadingField === "paymentQrPath"}
                onFile={(file) => void uploadImage(file, "paymentQrPath")}
                label="Upload payment QR"
              />
              <label className="block text-sm font-medium">
                Note for students
                <textarea
                  value={form.paymentInstructions}
                  onChange={(event) => setForm({ ...form, paymentInstructions: event.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                />
              </label>
            </div>
          )}

          <label className="block text-sm font-medium">
            Web address
            <span className="mt-1 flex items-center gap-1 rounded-xl border border-outline-variant/50 px-3 py-2 text-sm font-normal">
              <span className="text-on-surface-variant">/study/</span>
              <input
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: slugify(event.target.value) });
                }}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </span>
          </label>

          {editingId && (
            <button
              type="button"
              className="text-sm text-red-700"
              disabled={deletingId === editingId}
              onClick={() => {
                const course = courses.find((item) => item.id === editingId);
                if (course) void deleteCourse(course);
              }}
            >
              Delete this course
            </button>
          )}
        </section>
      )}

      <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/30 bg-white/95 p-3 shadow-sm backdrop-blur">
        <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((current) => (current === 3 ? 2 : 1))}>
          Back
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={goNext}>
            Continue
          </Button>
        ) : (
          <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? "Saving…" : editingId ? "Update course" : "Save course"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p className={`rounded-2xl px-4 py-3 text-sm ${tone === "error" ? "bg-red-50 text-red-700" : "bg-primary-container/15 text-on-background"}`}>
      {children}
    </p>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              value === option ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CoverPicker({
  path,
  uploading,
  onFile,
  label = "Cover photo",
}: {
  path: string;
  uploading: boolean;
  onFile: (file: File | null) => void;
  label?: string;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-1 flex min-h-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-low/50">
        {path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={path} alt="" className="max-h-48 w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center px-4 py-8 text-center text-sm text-on-surface-variant">
            <ImagePlus size={22} className="text-primary" />
            <span className="mt-2 font-medium text-on-background">Choose an image</span>
            <span className="mt-1">This is the photo on the course card.</span>
          </span>
        )}
      </span>
      <input type="file" accept="image/*" className="sr-only" onChange={(event) => onFile(event.target.files?.[0] ?? null)} />
      {uploading && <span className="mt-2 block text-xs text-primary">Uploading…</span>}
      {path && !uploading && <span className="mt-2 block text-xs text-primary">Click the image to replace it</span>}
    </label>
  );
}
