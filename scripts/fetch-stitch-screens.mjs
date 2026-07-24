/**
 * Downloads HTML and screenshots from a Google Stitch project.
 *
 * Usage:
 *   STITCH_API_KEY=your-key node scripts/fetch-stitch-screens.mjs
 *
 * Get your API key at stitch.withgoogle.com → Profile → Stitch settings → API key
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stitch } from "@google/stitch-sdk";

const PROJECT_ID = "7741317075877188142";

const SCREENS = [
  { id: "3423e790427c4514a7121f8876363d3d", slug: "course-explorer" },
  { id: "509862dce9fe496f9458375225c325af", slug: "masterclass-landing" },
  { id: "75ee79967a19498d9a9584290dbe2307", slug: "dashboard" },
  { id: "9aa73e7fe6644ab3a23c2c9fe5aa89dd", slug: "gamified-quiz" },
  { id: "d9099153da6e408ba80ad51ded9ee618", slug: "landing-page" },
];

const DESIGN_SYSTEM_ID = "asset-stub-assets_c4e49d272b414f2c95cf4e64d1cc6772";

const OUT_DIR = join(process.cwd(), "stitch-assets");

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`  ✓ ${dest}`);
}

async function fetchScreen(project, screenMeta) {
  const screen = await project.getScreen(screenMeta.id);
  const htmlUrl = await screen.getHtml();
  const imageUrl = await screen.getImage();
  const dir = join(OUT_DIR, screenMeta.slug);
  await mkdir(dir, { recursive: true });

  console.log(`\n${screenMeta.slug} (${screenMeta.id})`);
  await download(htmlUrl, join(dir, "index.html"));
  await download(imageUrl, join(dir, "screenshot.png"));

  return { slug: screenMeta.slug, htmlUrl, imageUrl };
}

async function main() {
  if (!process.env.STITCH_API_KEY) {
    console.error(
      "Missing STITCH_API_KEY. Create one at stitch.withgoogle.com → Profile → Stitch settings."
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const project = stitch.project(PROJECT_ID);

  console.log(`Fetching ${SCREENS.length} screens from project ${PROJECT_ID}...`);
  const results = [];
  for (const screen of SCREENS) {
    results.push(await fetchScreen(project, screen));
  }

  console.log(`\nDesign system asset: ${DESIGN_SYSTEM_ID}`);
  console.log("(Design system assets are fetched via listDesignSystems — check Stitch UI for export)");

  await writeFile(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify({ projectId: PROJECT_ID, screens: results, designSystemId: DESIGN_SYSTEM_ID }, null, 2)
  );
  console.log(`\nDone. Assets saved to ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
