"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CmsImage } from "@/components/cms/CmsImage";

export type HomeReview = {
  id: string;
  name: string;
  body: string;
  type: string;
  imagePath: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Course",
  NEWSLETTER: "Newsletter",
  EBOOK: "E-book",
};

type Props = {
  title?: string;
  description?: string;
  reviews: HomeReview[];
};

export function HomepageReviewsSection({ title, description, reviews }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [paused, setPaused] = useState(false);

  function updateArrows() {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  function scrollByCard(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-review-card]");
    const amount = (card?.offsetWidth ?? 320) + 16;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [reviews.length]);

  useEffect(() => {
    if (reviews.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, 4500);
    return () => window.clearInterval(timer);
  }, [reviews.length, paused]);

  if (!reviews.length) return null;

  return (
    <section className="overflow-hidden bg-surface-container-low py-xl" id="reviews">
      <div className="site-container">
        <div className="mb-lg flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display-md text-display-md text-on-background">
              {title || "What learners say"}
            </h2>
            <p className="mt-sm text-on-surface-variant">
              {description || "Real feedback from people who joined Sikau Paisa."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous review"
              disabled={!canPrev}
              onClick={() => scrollByCard(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 bg-white text-on-background disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next review"
              disabled={!canNext}
              onClick={() => scrollByCard(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 bg-white text-on-background disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="site-container"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((review) => (
            <article
              key={review.id}
              data-review-card
              className="flex w-[min(100%,22rem)] shrink-0 snap-start flex-col rounded-3xl bg-white p-6 shadow-lg sm:w-[24rem]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {review.imagePath ? (
                    <CmsImage
                      src={review.imagePath}
                      alt={review.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    review.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="truncate font-label-md">{review.name}</h4>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {TYPE_LABEL[review.type] ?? review.type}
                  </p>
                </div>
              </div>
              <p className="mt-4 line-clamp-5 flex-1 text-sm leading-6 text-on-surface-variant">
                &quot;{review.body}&quot;
              </p>
              {review.imagePath && (
                <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-2xl bg-surface-container">
                  <CmsImage src={review.imagePath} alt="" fill className="object-cover" />
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="mt-xl text-center">
          <Link href="/review" className="text-sm font-semibold text-primary hover:underline">
            Share your review
          </Link>
        </div>
      </div>
    </section>
  );
}
