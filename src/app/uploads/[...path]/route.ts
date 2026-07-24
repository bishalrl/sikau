import { NextResponse } from "next/server";
import { contentTypeForFileName, readUploadedFile } from "@/lib/local-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path: string[] }> };

/**
 * Serve runtime-uploaded files in production.
 * Next.js does not serve files added to /public after `next build`.
 */
export async function GET(_request: Request, { params }: Params) {
  const segments = (await params).path ?? [];
  if (segments.length !== 2) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const [folder, fileName] = segments;
  const file = await readUploadedFile(folder, fileName);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      "Content-Type": contentTypeForFileName(fileName),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(file.data.byteLength),
    },
  });
}
