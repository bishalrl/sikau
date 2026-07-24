import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const UPLOAD_FOLDERS = [
  "receipts",
  "course-assets",
  "payment-qr",
  "ebooks",
  "blog-covers",
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** Absolute directory where runtime uploads are stored. */
export function getUploadsRoot() {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.env.UPLOAD_DIR);
  }

  // Persist outside /public so Next production static rules don't hide new files.
  // turbopackIgnore keeps process.cwd() out of Turbopack's tracing warning.
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");
}

function getLegacyUploadsRoot() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
}

export function resolveUploadAbsolutePath(folder: string, fileName: string) {
  if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
    return null;
  }
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return null;
  }

  const candidates = [getUploadsRoot(), getLegacyUploadsRoot()];
  for (const root of candidates) {
    const absolutePath = path.join(root, folder, fileName);
    const normalizedRoot = path.normalize(root + path.sep);
    if (path.normalize(absolutePath).startsWith(normalizedRoot)) {
      return absolutePath;
    }
  }
  return null;
}

export async function saveUploadedFile(file: File, folder: UploadFolder) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".bin";
  const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const absoluteDir = path.join(getUploadsRoot(), folder);
  await mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, fileName);
  await writeFile(absolutePath, buffer);

  return `/uploads/${folder}/${fileName}`;
}

export async function readUploadedFile(folder: string, fileName: string) {
  if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
    return null;
  }
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return null;
  }

  const roots = [getUploadsRoot(), getLegacyUploadsRoot()];
  for (const root of roots) {
    const absolutePath = path.join(root, folder, fileName);
    const normalizedRoot = path.normalize(root + path.sep);
    if (!path.normalize(absolutePath).startsWith(normalizedRoot)) {
      continue;
    }
    try {
      await access(absolutePath);
      const data = await readFile(absolutePath);
      return { absolutePath, data };
    } catch {
      // try next root
    }
  }
  return null;
}

export function contentTypeForFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".pdf":
      return "application/pdf";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}
