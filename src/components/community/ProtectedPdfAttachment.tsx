"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const options = {
  cMapUrl: "/pdf-cmaps/",
  standardFontDataUrl: "/pdf-fonts/",
  wasmUrl: "/pdf-wasm/",
};

type Props = {
  title: string;
  fileHref: string;
};

/** In-app PDF reader — no download UI (newsletter / protected attachments). */
export function ProtectedPdfAttachment({ title, fileHref }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState(320);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState("");
  const file = useMemo(() => fileHref, [fileHref]);

  useEffect(() => {
    if (!open) return;
    setScale(1);
    setPageNumber(1);
    function measure() {
      if (!containerRef.current) return;
      setWidth(Math.max(260, Math.min(720, containerRef.current.clientWidth - 24)));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "+" || event.key === "=") {
        setScale((value) => Math.min(2.5, Number((value + 0.15).toFixed(2))));
      }
      if (event.key === "-" || event.key === "_") {
        setScale((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const goTo = useCallback(
    (next: number) => {
      setPageNumber((current) => {
        const target = Math.min(Math.max(1, next), numPages || 1);
        if (target !== current) containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return target;
      });
    },
    [numPages],
  );

  const zoomOut = () => setScale((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))));
  const zoomIn = () => setScale((value) => Math.min(2.5, Number((value + 0.15).toFixed(2))));
  const zoomPercent = Math.round(scale * 100);

  return (
    <>
      <button type="button" className="protected-pdf-card" onClick={() => setOpen(true)}>
        <span className="protected-pdf-card__icon" aria-hidden>
          PDF
        </span>
        <span className="protected-pdf-card__copy">
          <span className="protected-pdf-card__name">{title}</span>
          <span className="protected-pdf-card__hint">Open in app · view only</span>
        </span>
      </button>

      {open && (
        <div
          className="protected-pdf-modal"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
        >
          <div
            className="protected-pdf-modal__panel"
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
          >
            <header className="protected-pdf-modal__header">
              <div>
                <p className="protected-pdf-modal__eyebrow">View only</p>
                <h2 className="protected-pdf-modal__title">{title}</h2>
              </div>
              <button type="button" className="protected-pdf-modal__close" onClick={() => setOpen(false)}>
                Close
              </button>
            </header>

            <div className="protected-pdf-modal__pager">
              <button type="button" onClick={() => goTo(pageNumber - 1)} disabled={pageNumber <= 1}>
                Previous
              </button>
              <span>
                Page {pageNumber}
                {numPages ? ` / ${numPages}` : ""}
              </span>
              <button
                type="button"
                onClick={() => goTo(pageNumber + 1)}
                disabled={numPages > 0 && pageNumber >= numPages}
              >
                Next
              </button>
            </div>

            <div className="protected-pdf-modal__zoom" role="group" aria-label="Zoom">
              <button type="button" onClick={zoomOut} disabled={scale <= 0.6} aria-label="Zoom out">
                Zoom out
              </button>
              <span>{zoomPercent}%</span>
              <button type="button" onClick={zoomIn} disabled={scale >= 2.5} aria-label="Zoom in">
                Zoom in
              </button>
              <button type="button" onClick={() => setScale(1)} disabled={scale === 1}>
                Reset
              </button>
            </div>

            <div className="protected-pdf-modal__stage" ref={containerRef}>
              {error ? (
                <p className="protected-pdf-modal__error">{error}</p>
              ) : (
                <Document
                  file={file}
                  options={options}
                  onLoadSuccess={({ numPages: total }) => {
                    setNumPages(total);
                    setError("");
                  }}
                  onLoadError={() => setError("Unable to open this PDF.")}
                  loading={<p className="protected-pdf-modal__error">Loading PDF…</p>}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={width}
                    scale={scale}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={<p className="protected-pdf-modal__error">Rendering…</p>}
                  />
                </Document>
              )}
            </div>

            <p className="protected-pdf-modal__notice">Download is disabled for newsletter PDFs.</p>
          </div>
        </div>
      )}
    </>
  );
}

export function isPdfAttachment(mime: string, name: string) {
  return mime === "application/pdf" || name.toLowerCase().endsWith(".pdf");
}

/** Map public upload path to membership-gated newsletter media URL. */
export function newsletterPdfViewUrl(communityId: string, publicPath: string) {
  const match = /^\/uploads\/([^/]+)\/([^/]+)$/.exec(publicPath);
  if (!match) return publicPath;
  const [, folder, fileName] = match;
  return `/api/community/${communityId}/media?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(fileName)}`;
}
