/** Brand assets under /public/rajuimageandqr — served via /api/assets on production. */
export const SITE_ASSETS = {
  logo: "/api/assets/logo.jpeg",
  cover: "/api/assets/ebook-cover.jpeg",
  qr: "/api/assets/bankqr.jpeg",
  pdf: "/api/assets/e-book.pdf",
} as const;

/** Public paths also kept for DB/seed compatibility */
export const SITE_ASSET_FILES = {
  logo: "/rajuimageandqr/logo.jpeg",
  cover: "/rajuimageandqr/ebook-cover.jpeg",
  qr: "/rajuimageandqr/bankqr.jpeg",
  pdf: "/rajuimageandqr/e-book.pdf",
} as const;
