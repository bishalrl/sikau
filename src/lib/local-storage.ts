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
  // Keep writing under public/uploads so local paths stay familiar,
  // but production serving goes through /uploads/[...path] (not static public).
  return path.join(process.cwd(), "public", "uploads");
}

export function resolveUploadAbsolutePath(folder: string, fileName: string) {
  if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
    return null;
  }
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return null;
  }

  const root = getUploadsRoot();
  const absolutePath = path.join(root, folder, fileName);
  const normalizedRoot = path.normalize(root + path.sep);
  if (!path.normalize(absolutePath).startsWith(normalizedRoot)) {
    return null;
  }
  return absolutePath;
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
  const absolutePath = resolveUploadAbsolutePath(folder, fileName);
  if (!absolutePath) return null;

  try {
    await access(absolutePath);
    const data = await readFile(absolutePath);
    return { absolutePath, data };
  } catch {
    return null;
  }
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
