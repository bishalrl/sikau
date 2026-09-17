/**
 * Browser-side chunked upload straight to Cloudflare R2 via presigned URLs.
 * Built for multi-GB course videos: retries, parallel parts, and ETag fallback.
 */

export type R2UploadProgress = {
  percent: number;
  loaded: number;
  total: number;
  partNumber?: number;
  totalParts?: number;
  message?: string;
};

const MAX_PART_RETRIES = 5;
const PARALLEL_PARTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${response.status}).`);
  }
  return data as Record<string, unknown>;
}

async function putWithRetry(url: string, body: Blob, contentType?: string, attempts = MAX_PART_RETRIES) {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      // Large parts on slow links can take a long time; allow up to 30 minutes per attempt.
      const timer = window.setTimeout(() => controller.abort(), 30 * 60 * 1000);
      const response = await fetch(url, {
        method: "PUT",
        headers: contentType ? { "Content-Type": contentType } : undefined,
        body,
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`R2 rejected the chunk (${response.status})${text ? `: ${text.slice(0, 120)}` : ""}`);
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Upload chunk failed.");
      if (attempt < attempts) {
        await sleep(Math.min(30_000, 1000 * 2 ** (attempt - 1)));
        continue;
      }
    }
  }
  throw lastError ?? new Error("Upload chunk failed.");
}

async function resolvePartEtag(
  response: Response,
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<string> {
  const header = response.headers.get("ETag") || response.headers.get("etag");
  if (header) {
    return header.startsWith('"') ? header : `"${header}"`;
  }

  // CORS may hide ETag — ask R2 through our API.
  const listed = await fetchJson("/api/upload/r2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list-parts", key, uploadId }),
  });
  const parts = (listed.parts as Array<{ ETag: string; PartNumber: number }> | undefined) ?? [];
  const found = parts.find((part) => part.PartNumber === partNumber);
  if (!found?.ETag) {
    throw new Error(
      `Missing ETag for part ${partNumber}. Apply R2 CORS with ExposeHeaders: ETag, then try again.`,
    );
  }
  return found.ETag.startsWith('"') ? found.ETag : `"${found.ETag}"`;
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current]);
    }
  });
  await Promise.all(runners);
}

export async function uploadCourseAssetToR2(
  file: File,
  onProgress?: (percent: number, detail?: R2UploadProgress) => void,
): Promise<{ storagePath: string; mimeType: string; name: string; size: number }> {
  const report = (loaded: number, extra?: Partial<R2UploadProgress>) => {
    const percent = file.size ? Math.min(99, Math.round((loaded / file.size) * 100)) : 0;
    onProgress?.(percent, {
      percent,
      loaded,
      total: file.size,
      ...extra,
    });
  };

  report(0, { message: "Starting upload…" });

  const created = await fetchJson("/api/upload/r2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create",
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });

  if (created.mode === "single") {
    await putWithRetry(created.url as string, file, file.type || "application/octet-stream");
    onProgress?.(100, { percent: 100, loaded: file.size, total: file.size, message: "Upload complete" });
    return {
      storagePath: created.storagePath as string,
      mimeType: file.type || "application/octet-stream",
      name: file.name,
      size: file.size,
    };
  }

  const key = created.key as string;
  const uploadId = created.uploadId as string;
  const partSize = Number(created.partSize) || 32 * 1024 * 1024;
  const totalParts = Math.ceil(file.size / partSize);
  const parts: Array<{ ETag: string; PartNumber: number; size: number }> = [];
  const completedSizes = new Map<number, number>();

  const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

  const refreshProgress = (message?: string, partNumber?: number) => {
    const loaded = [...completedSizes.values()].reduce((sum, size) => sum + size, 0);
    report(loaded, {
      partNumber,
      totalParts,
      message,
    });
  };

  try {
    await runPool(partNumbers, PARALLEL_PARTS, async (partNumber) => {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= MAX_PART_RETRIES; attempt += 1) {
        try {
          refreshProgress(
            attempt > 1
              ? `Retrying part ${partNumber}/${totalParts} (try ${attempt})…`
              : `Uploading part ${partNumber}/${totalParts}…`,
            partNumber,
          );

          const signed = await fetchJson("/api/upload/r2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sign-part", key, uploadId, partNumber }),
          });

          const putRes = await putWithRetry(signed.url as string, blob, undefined, 1);
          const etag = await resolvePartEtag(putRes, key, uploadId, partNumber);
          parts.push({ ETag: etag, PartNumber: partNumber, size: blob.size });
          completedSizes.set(partNumber, blob.size);
          refreshProgress(`Uploaded part ${partNumber}/${totalParts}`, partNumber);
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Part upload failed.");
          if (attempt < MAX_PART_RETRIES) {
            await sleep(Math.min(30_000, 1500 * 2 ** (attempt - 1)));
          }
        }
      }
      throw lastError ?? new Error(`Upload failed on part ${partNumber}/${totalParts}.`);
    });

    report(file.size, { message: "Finishing upload…" });

    // Prefer ETags collected from the browser; fill any gaps from R2.
    let finalParts = parts
      .map(({ ETag, PartNumber }) => ({ ETag, PartNumber }))
      .sort((a, b) => a.PartNumber - b.PartNumber);
    if (finalParts.length !== totalParts) {
      const listed = await fetchJson("/api/upload/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list-parts", key, uploadId }),
      });
      finalParts = ((listed.parts as Array<{ ETag: string; PartNumber: number }> | undefined) ?? []).slice();
    }
    if (finalParts.length !== totalParts) {
      throw new Error(`Upload incomplete: got ${finalParts.length} of ${totalParts} parts.`);
    }

    const completed = await fetchJson("/api/upload/r2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", key, uploadId, parts: finalParts }),
    });

    onProgress?.(100, { percent: 100, loaded: file.size, total: file.size, message: "Upload complete" });
    return {
      storagePath: completed.storagePath as string,
      mimeType: file.type || "application/octet-stream",
      name: file.name,
      size: file.size,
    };
  } catch (error) {
    await fetch("/api/upload/r2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "abort", key, uploadId }),
    }).catch(() => undefined);
    throw error;
  }
}
