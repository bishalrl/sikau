import { cpSync, copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// Copies the pdfjs worker + support assets (matching the version react-pdf
// bundles) into /public so the page-by-page ebook reader works offline and
// without any pdfjs version mismatch.
const require = createRequire(import.meta.url);

function resolvePdfjsBase() {
  const pkg = require.resolve("pdfjs-dist/package.json", {
    paths: [path.resolve("node_modules/react-pdf"), process.cwd()],
  });
  return path.dirname(pkg);
}

try {
  const base = resolvePdfjsBase();
  mkdirSync("public", { recursive: true });

  copyFileSync(path.join(base, "build", "pdf.worker.min.mjs"), path.join("public", "pdf.worker.min.mjs"));
  cpSync(path.join(base, "cmaps"), path.join("public", "pdf-cmaps"), { recursive: true });
  cpSync(path.join(base, "standard_fonts"), path.join("public", "pdf-fonts"), { recursive: true });
  cpSync(path.join(base, "wasm"), path.join("public", "pdf-wasm"), { recursive: true });

  console.log("pdf assets copied to /public (worker, cmaps, fonts, wasm).");
} catch (error) {
  console.warn("Skipped copying pdf assets:", error?.message ?? error);
}
