import { NextResponse } from "next/server";
import { readSiteAsset } from "@/lib/site-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  const segments = (await params).path ?? [];
  if (segments.length !== 1) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const file = await readSiteAsset(segments[0]);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=86400",
      "Content-Length": String(file.data.byteLength),
    },
  });
}
