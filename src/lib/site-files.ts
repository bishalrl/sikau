import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { contentTypeForFileName } from "@/lib/local-storage";

const ALLOWED_SITE_FILES = new Set([
  "logo.jpeg",
  "ebook-cover.jpeg",
  "bankqr.jpeg",
  "e-book.pdf",
  "rajuimage1.jpeg",
  "rajuimage2.jpeg",
  "rajuimage3.jpeg",
]);

export function getSiteAssetsRoot() {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "rajuimageandqr");
}

export async function readSiteAsset(fileName: string) {
  if (
    !ALLOWED_SITE_FILES.has(fileName) ||
    fileName.includes("..") ||
    fileName.includes("/") ||
    fileName.includes("\\")
  ) {
    return null;
  }

  const absolutePath = path.join(getSiteAssetsRoot(), fileName);
  try {
    await access(absolutePath);
    const data = await readFile(absolutePath);
    return {
      data,
      contentType: contentTypeForFileName(fileName),
    };
  } catch {
    return null;
  }
}

export async function writeSiteAsset(fileName: string, data: Buffer) {
  if (
    !ALLOWED_SITE_FILES.has(fileName) ||
    fileName.includes("..") ||
    fileName.includes("/") ||
    fileName.includes("\\")
  ) {
    return false;
  }

  const root = getSiteAssetsRoot();
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, fileName), data);
  return true;
}
