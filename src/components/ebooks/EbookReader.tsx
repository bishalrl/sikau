"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { MaterialIcon } from "@/components/landing/MaterialIcon";

type Props = {
  title: string;
  titleNe?: string | null;
  content: string;
  backHref: string;
  downloadHref?: string | null;
};

export function EbookReader({ title, titleNe, content, backHref, downloadHref }: Props) {
  const contentRef = useRef<HTMLElement>(null);
  const [fontScale, setFontScale] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(100, Math.round((scrolled / height) * 100)) : 0);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="ebook-reader">
      <div className="ebook-reader__progress" style={{ width: `${progress}%` }} />

      <header className="ebook-reader__toolbar">
        <div className="site-container ebook-reader__toolbar-inner">
          <Link href={backHref} className="ebook-reader__back">
            <MaterialIcon name="arrow_back" className="text-[18px]" />
            Back
          </Link>

          <div className="ebook-reader__controls">
            <button
              type="button"
              aria-label="Decrease text size"
              className="ebook-reader__control"
              onClick={() => setFontScale((value) => Math.max(0.85, Number((value - 0.1).toFixed(2))))}
            >
              A−
            </button>
            <button
              type="button"
              aria-label="Increase text size"
              className="ebook-reader__control"
              onClick={() => setFontScale((value) => Math.min(1.4, Number((value + 0.1).toFixed(2))))}
            >
              A+
            </button>
            {downloadHref && (
              <a href={downloadHref} target="_blank" rel="noreferrer" className="ebook-reader__control ebook-reader__download">
                <MaterialIcon name="download" className="text-[18px]" />
                PDF
              </a>
            )}
          </div>
        </div>
      </header>

      <article
        ref={contentRef}
        className="ebook-reader__article site-container"
        style={{ fontSize: `${fontScale}rem` }}
      >
        <p className="ebook-reader__eyebrow">Ebook Reader</p>
        <h1 className="ebook-reader__title">{title}</h1>
        {titleNe && <p className="ebook-reader__subtitle">{titleNe}</p>}
        <p className="ebook-reader__meta">{progress}% complete</p>

        <div className="ebook-reader__content prose prose-lg max-w-none">
          <ReactMarkdown>{content || "This ebook does not have readable content yet."}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
