/**
 * Browser-side chunked upload straight to Cloudflare R2 via presigned URLs.
 * Supports multi-GB course videos without sending the file through Next.js.
 */
export async function uploadCourseAssetToR2(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ storagePath: string; mimeType: string; name: string; size: number }> {
  const createRes = await fetch("/api/upload/r2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create",
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    throw new Error(created.error ?? "Unable to start R2 upload.");
  }

  if (created.mode === "single") {
    const putRes = await fetch(created.url as string, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error("Direct R2 upload failed.");
    }
    onProgress?.(100);
    return {
      storagePath: created.storagePath as string,
      mimeType: file.type || "application/octet-stream",
      name: file.name,
      size: file.size,
    };
  }

  const key = created.key as string;
  const uploadId = created.uploadId as string;
  const partSize = Number(created.partSize) || 16 * 1024 * 1024;
  const totalParts = Math.ceil(file.size / partSize);
  const parts: Array<{ ETag: string; PartNumber: number }> = [];

  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      const signRes = await fetch("/api/upload/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign-part", key, uploadId, partNumber }),
      });
      const signed = await signRes.json();
      if (!signRes.ok) {
        throw new Error(signed.error ?? `Unable to sign part ${partNumber}.`);
      }

      const putRes = await fetch(signed.url as string, {
        method: "PUT",
        body: blob,
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed on part ${partNumber}/${totalParts}.`);
      }

      const etag = putRes.headers.get("ETag") || putRes.headers.get("etag");
      if (!etag) {
        throw new Error(`Missing ETag for part ${partNumber}. Check R2 CORS allows ETag exposure.`);
      }
      const normalized = etag.startsWith('"') ? etag : `"${etag}"`;
      parts.push({ ETag: normalized, PartNumber: partNumber });

      onProgress?.(Math.round((partNumber / totalParts) * 100));
    }

    const completeRes = await fetch("/api/upload/r2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", key, uploadId, parts }),
    });
    const completed = await completeRes.json();
    if (!completeRes.ok) {
      throw new Error(completed.error ?? "Unable to complete R2 upload.");
    }

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
