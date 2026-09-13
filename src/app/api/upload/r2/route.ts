import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  abortMultipartUpload,
  buildCourseAssetKey,
  completeMultipartUpload,
  createMultipartUpload,
  getSignedDownloadUrl,
  isR2Configured,
  signSinglePut,
  signUploadPart,
  storagePathFromR2Key,
} from "@/lib/r2";

function assertAdmin(session: { user?: { role?: string | null } } | null) {
  return Boolean(session?.user && ["ADMIN", "INSTRUCTOR"].includes(session.user.role ?? ""));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!assertAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "R2 is not configured. Add R2_* variables to .env and create the bucket." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "create") {
      const input = z
        .object({
          fileName: z.string().min(1),
          contentType: z.string().min(1).default("application/octet-stream"),
          fileSize: z.number().int().positive(),
        })
        .parse(body);

      const key = buildCourseAssetKey(input.fileName);
      // Files under 20MB can use a single PUT; larger use multipart.
      if (input.fileSize <= 20 * 1024 * 1024) {
        const url = await signSinglePut(key, input.contentType);
        return NextResponse.json({
          mode: "single",
          key,
          url,
          storagePath: storagePathFromR2Key(key),
        });
      }

      const { uploadId } = await createMultipartUpload(key, input.contentType);
      return NextResponse.json({
        mode: "multipart",
        key,
        uploadId,
        storagePath: storagePathFromR2Key(key),
        // 16MB parts keep request counts reasonable for 2–3GB files.
        partSize: 16 * 1024 * 1024,
      });
    }

    if (action === "sign-part") {
      const input = z
        .object({
          key: z.string().min(1),
          uploadId: z.string().min(1),
          partNumber: z.number().int().min(1).max(10000),
        })
        .parse(body);
      const url = await signUploadPart(input.key, input.uploadId, input.partNumber);
      return NextResponse.json({ url });
    }

    if (action === "complete") {
      const input = z
        .object({
          key: z.string().min(1),
          uploadId: z.string().min(1),
          parts: z
            .array(
              z.object({
                ETag: z.string().min(1),
                PartNumber: z.number().int().min(1),
              }),
            )
            .min(1),
        })
        .parse(body);
      const storagePath = await completeMultipartUpload(input.key, input.uploadId, input.parts);
      return NextResponse.json({ storagePath });
    }

    if (action === "preview") {
      const input = z.object({ storagePath: z.string().min(1) }).parse(body);
      const url = await getSignedDownloadUrl(input.storagePath, 60 * 60);
      return NextResponse.json({ url });
    }

    if (action === "abort") {
      const input = z
        .object({
          key: z.string().min(1),
          uploadId: z.string().min(1),
        })
        .parse(body);
      await abortMultipartUpload(input.key, input.uploadId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("R2 upload API failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to prepare R2 upload." },
      { status: 500 },
    );
  }
}
