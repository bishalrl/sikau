"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { MaterialIcon } from "@/components/landing/MaterialIcon";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const options = {
  cMapUrl: "/pdf-cmaps/",
  standardFontDataUrl: "/pdf-fonts/",
  wasmUrl: "/pdf-wasm/",
};

type Props = {
  title: string;
  titleNe?: string | null;
  fileHref: string;
  backHref: string;
  allowDownload?: boolean;
};

export function EbookPdfReader({ title, titleNe, fileHref, backHref, allowDownload = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(720);
  const [error, setError] = useState("");
  const [pageInput, setPageInput] = useState("1");

  const file = useMemo(() => fileHref, [fileHref]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const available = containerRef.current.clientWidth - 32;
      setWidth(Math.max(280, Math.min(900, available)));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mounted]);

  const goTo = useCallback(
    (next: number) => {
      setPageNumber((current) => {
        const target = Math.min(Math.max(1, next), numPages || 1);
        setPageInput(String(target));
        if (target !== current) {
          containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }
        return target;
      });
    },
    [numPages],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goTo(pageNumber + 1);
      if (event.key === "ArrowLeft") goTo(pageNumber - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, pageNumber]);

  const progress = numPages ? Math.round((pageNumber / numPages) * 100) : 0;

  return (
    <div className="pdf-reader">
      <div className="pdf-reader__progress" style={{ width: `${progress}%` }} />

      <header className="pdf-reader__toolbar">
        <div className="site-container pdf-reader__toolbar-inner">
          <Link href={backHref} className="pdf-reader__back">
            <MaterialIcon name="arrow_back" className="text-[18px]" />
            Back
          </Link>

          <div className="pdf-reader__pager">
            <button
              type="button"
              className="pdf-reader__control"
              onClick={() => goTo(pageNumber - 1)}
              disabled={pageNumber <= 1}
              aria-label="Previous page"
            >
              <MaterialIcon name="chevron_left" className="text-[20px]" />
            </button>

            <form
              className="pdf-reader__page-jump"
              onSubmit={(event) => {
                event.preventDefault();
                const parsed = Number(pageInput);
                if (!Number.isNaN(parsed)) goTo(parsed);
              }}
            >
              <input
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                aria-label="Page number"
                className="pdf-reader__page-input"
              />
              <span className="pdf-reader__page-total">/ {numPages || "–"}</span>
            </form>

            <button
              type="button"
              className="pdf-reader__control"
              onClick={() => goTo(pageNumber + 1)}
              disabled={numPages > 0 && pageNumber >= numPages}
              aria-label="Next page"
            >
              <MaterialIcon name="chevron_right" className="text-[20px]" />
            </button>
          </div>

          <div className="pdf-reader__controls">
            <button
              type="button"
              className="pdf-reader__control"
              onClick={() => setScale((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))))}
              aria-label="Zoom out"
            >
              <MaterialIcon name="zoom_out" className="text-[18px]" />
            </button>
            <button
              type="button"
              className="pdf-reader__control"
              onClick={() => setScale((value) => Math.min(2.5, Number((value + 0.15).toFixed(2))))}
              aria-label="Zoom in"
            >
              <MaterialIcon name="zoom_in" className="text-[18px]" />
            </button>
            {allowDownload && (
              <a
                href={fileHref}
                target="_blank"
                rel="noreferrer"
                className="pdf-reader__control pdf-reader__download"
              >
                <MaterialIcon name="download" className="text-[18px]" />
                PDF
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="pdf-reader__stage" ref={containerRef}>
        <div className="pdf-reader__heading">
          <p className="pdf-reader__eyebrow">Ebook</p>
          <h1 className="pdf-reader__title">{title}</h1>
          {titleNe && <p className="pdf-reader__subtitle">{titleNe}</p>}
        </div>

        {error ? (
          <div className="pdf-reader__message">
            <p>{error}</p>
            {allowDownload && (
              <a href={fileHref} target="_blank" rel="noreferrer" className="pdf-reader__message-link">
                Download the PDF instead
              </a>
            )}
          </div>
        ) : (
          mounted && (
            <Document
              file={file}
              options={options}
              onLoadSuccess={({ numPages: total }) => {
                setNumPages(total);
                setError("");
              }}
              onLoadError={() => setError("We couldn't load this PDF. Please try again later.")}
              loading={<div className="pdf-reader__message">Loading ebook…</div>}
              className="pdf-reader__document"
            >
              <div className="pdf-reader__page-frame">
                <Page
                  pageNumber={pageNumber}
                  width={width}
                  scale={scale}
                  renderAnnotationLayer={false}
                  renderTextLayer
                  loading={<div className="pdf-reader__message">Rendering page…</div>}
                  className="pdf-reader__page"
                />
              </div>
            </Document>
          )
        )}

        <div className="pdf-reader__footer">
          <button
            type="button"
            className="pdf-reader__nav-btn"
            onClick={() => goTo(pageNumber - 1)}
            disabled={pageNumber <= 1}
          >
            <MaterialIcon name="chevron_left" className="text-[18px]" />
            Previous
          </button>
          <span className="pdf-reader__footer-meta">
            {numPages ? `Page ${pageNumber} of ${numPages}` : "Loading…"}
          </span>
          <button
            type="button"
            className="pdf-reader__nav-btn"
            onClick={() => goTo(pageNumber + 1)}
            disabled={numPages > 0 && pageNumber >= numPages}
          >
            Next
            <MaterialIcon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
