import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

type UploadFolder = "receipts" | "course-assets" | "payment-qr" | "ebooks" | "blog-covers";

export async function saveUploadedFile(file: File, folder: UploadFolder) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".bin";
  const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const relativeDir = path.join("public", "uploads", folder);
  const absoluteDir = path.join(process.cwd(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, fileName);
  await writeFile(absolutePath, buffer);

  return `/uploads/${folder}/${fileName}`;
}
