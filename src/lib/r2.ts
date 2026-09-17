import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import path from "node:path";

const R2_PREFIX = "r2:";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function isR2Configured() {
  return Boolean(
    process.env.R2_ENDPOINT?.trim() &&
      process.env.R2_BUCKET?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  );
}

export function getR2Bucket() {
  return requiredEnv("R2_BUCKET");
}

function createR2Client(mode: "write" | "read" = "write") {
  const endpoint = requiredEnv("R2_ENDPOINT");
  const accessKeyId =
    mode === "read" && process.env.R2_READ_ACCESS_KEY_ID?.trim()
      ? process.env.R2_READ_ACCESS_KEY_ID.trim()
      : requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey =
    mode === "read" && process.env.R2_READ_SECRET_ACCESS_KEY?.trim()
      ? process.env.R2_READ_SECRET_ACCESS_KEY.trim()
      : requiredEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

export function isR2StoragePath(storagePath: string) {
  return storagePath.startsWith(R2_PREFIX) || storagePath.startsWith("r2://");
}

/** Normalize stored path to object key inside the bucket. */
export function r2KeyFromStoragePath(storagePath: string) {
  if (storagePath.startsWith("r2://")) {
    const without = storagePath.slice("r2://".length);
    const slash = without.indexOf("/");
    return slash >= 0 ? without.slice(slash + 1) : without;
  }
  if (storagePath.startsWith(R2_PREFIX)) {
    return storagePath.slice(R2_PREFIX.length);
  }
  return storagePath.replace(/^\/+/, "");
}

export function storagePathFromR2Key(key: string) {
  return `${R2_PREFIX}${key.replace(/^\/+/, "")}`;
}

export function buildCourseAssetKey(fileName: string) {
  const ext = path.extname(fileName) || ".bin";
  const safeExt = ext.slice(0, 12).replace(/[^\w.]/g, "") || ".bin";
  return `course-assets/${Date.now()}-${crypto.randomUUID()}${safeExt}`;
}

export async function createMultipartUpload(key: string, contentType: string) {
  const client = createR2Client("write");
  const result = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ContentType: contentType || "application/octet-stream",
    }),
  );
  if (!result.UploadId) {
    throw new Error("R2 did not return an upload id.");
  }
  return { uploadId: result.UploadId, key };
}

export async function signUploadPart(key: string, uploadId: string, partNumber: number) {
  const client = createR2Client("write");
  const command = new UploadPartCommand({
    Bucket: getR2Bucket(),
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  // 2 hours per part — large video chunks on slow connections.
  return getSignedUrl(client, command, { expiresIn: 60 * 60 * 2 });
}

/** Read part ETags from R2 when the browser cannot see the ETag header (CORS). */
export async function listUploadedParts(key: string, uploadId: string) {
  const client = createR2Client("write");
  const parts: Array<{ ETag: string; PartNumber: number }> = [];
  let partNumberMarker: string | undefined;

  do {
    const result = await client.send(
      new ListPartsCommand({
        Bucket: getR2Bucket(),
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: partNumberMarker,
        MaxParts: 1000,
      }),
    );
    for (const part of result.Parts ?? []) {
      if (!part.PartNumber || !part.ETag) continue;
      const etag = part.ETag.startsWith('"') ? part.ETag : `"${part.ETag}"`;
      parts.push({ ETag: etag, PartNumber: part.PartNumber });
    }
    partNumberMarker = result.IsTruncated ? result.NextPartNumberMarker : undefined;
  } while (partNumberMarker);

  return parts.sort((a, b) => a.PartNumber - b.PartNumber);
}

export function chooseMultipartPartSize(fileSize: number) {
  // Fewer parts = fewer network round-trips. S3/R2 max 10,000 parts; min part 5MB.
  if (fileSize >= 3 * 1024 * 1024 * 1024) return 64 * 1024 * 1024;
  if (fileSize >= 1024 * 1024 * 1024) return 32 * 1024 * 1024;
  return 16 * 1024 * 1024;
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ ETag: string; PartNumber: number }>,
) {
  const client = createR2Client("write");
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: getR2Bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .slice()
          .sort((a, b) => a.PartNumber - b.PartNumber)
          .map((part) => ({ ETag: part.ETag, PartNumber: part.PartNumber })),
      },
    }),
  );
  return storagePathFromR2Key(key);
}

export async function abortMultipartUpload(key: string, uploadId: string) {
  const client = createR2Client("write");
  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: getR2Bucket(),
      Key: key,
      UploadId: uploadId,
    }),
  );
}

/** Small files can use a single PUT (still direct to R2). */
export async function signSinglePut(key: string, contentType: string) {
  const client = createR2Client("write");
  const command = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });
  return getSignedUrl(client, command, { expiresIn: 60 * 60 });
}

export async function getSignedDownloadUrl(storagePath: string, expiresInSeconds = 60 * 60 * 6) {
  if (!isR2StoragePath(storagePath)) {
    return storagePath;
  }

  const key = r2KeyFromStoragePath(storagePath);

  // Prefer signed S3 URLs so playback works even when the object is private.
  // Only use a public CDN/base URL when R2_USE_PUBLIC_URL=true.
  const usePublic = process.env.R2_USE_PUBLIC_URL === "true";
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (usePublic && publicBase) {
    return `${publicBase}/${key}`;
  }

  const client = createR2Client("write");
  const command = new GetObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function resolveMediaUrl(storagePath: string) {
  if (isR2StoragePath(storagePath)) {
    return getSignedDownloadUrl(storagePath);
  }
  return storagePath;
}
