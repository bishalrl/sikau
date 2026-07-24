"use client";

import Image from "next/image";
import { useState } from "react";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { EnrollButton } from "@/components/learn/EnrollButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { CourseCard } from "@/lib/repositories";

type Props = {
  courses: CourseCard[];
  categories: string[];
  copy?: {
    badge?: string;
    title?: string;
    description?: string;
  };
};

export function LearnCourseGrid({ courses, categories, copy }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = courses.filter((course) => {
    const matchesCategory =
      activeCategory === "All" || course.category === activeCategory;
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      (course.titleNe ?? "").includes(search) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="bg-surface py-xl" id="courses">
      <div className="site-container">
        <div className="learn-section-header">
          <div className="learn-section-intro">
            <Badge variant="emerald" className="mb-sm">
              {copy?.badge ?? "All Courses"}
            </Badge>
            <h2 className="font-display-md text-display-md text-on-background">
              {copy?.title ?? "Explore More Lessons"}
            </h2>
            <p className="mt-sm section-intro font-body-md text-on-surface-variant">
              {copy?.description ??
                `Browse ${courses.length} courses across personal finance, investing, and digital payments.`}
            </p>
          </div>
          <div className="learn-section-search">
            <MaterialIcon
              name="search"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="search"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-2.5 pr-4 pl-10 font-body-md text-on-background outline-none ring-primary focus:ring-2"
            />
          </div>
        </div>

        <div className="mt-lg flex flex-wrap gap-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 font-label-md transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/40 hover:bg-primary-container/10 hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Card key={course.id} hover className="overflow-hidden">
              <div className="relative h-44">
                <Image src={course.image} alt={course.title} fill className="object-cover" />
                {course.featured && (
                  <Badge variant="gold" className="absolute left-3 top-3">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="p-md">
                <div className="flex flex-wrap items-center gap-xs">
                  <Badge variant="emerald">{course.category}</Badge>
                  <Badge>{course.level}</Badge>
                  {course.paymentStatus === "APPROVED" && <Badge variant="gold">Enrolled</Badge>}
                  {course.paymentStatus === "PENDING" && <Badge>Payment pending</Badge>}
                </div>
                <h3 className="mt-sm font-label-md text-on-background">{course.title}</h3>
                <p className="font-label-sm text-primary">{course.titleNe}</p>
                <p className="mt-sm line-clamp-2 font-body-md text-on-surface-variant">
                  {course.description}
                </p>
                <div className="mt-md flex flex-wrap items-center gap-md font-label-sm text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <MaterialIcon name="schedule" className="text-[16px]" />
                    {course.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MaterialIcon name="group" className="text-[16px]" />
                    {course.students.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MaterialIcon name="star" className="text-[16px] text-tertiary-container" filled />
                    {course.rating}
                  </span>
                </div>
                {course.progress !== undefined && (
                  <div className="mt-md">
                    <div className="mb-1 flex justify-between font-label-sm">
                      <span className="text-on-surface-variant">Progress</span>
                      <span className="font-semibold text-primary">{course.progress}%</span>
                    </div>
                    <ProgressBar value={course.progress} size="sm" />
                  </div>
                )}
                {course.paymentStatus === "APPROVED" ? (
                  <Button size="sm" className="mt-md w-full" href={`/study/${course.slug}`}>
                    {course.progress && course.progress > 0 ? `Continue · ${course.progress}%` : "Start Course"}
                  </Button>
                ) : course.paymentStatus === "PENDING" ? (
                  <Button size="sm" className="mt-md w-full" variant="outline" href={`/payment/${course.slug}`}>
                    Complete payment
                  </Button>
                ) : (
                  <EnrollButton courseSlug={course.slug} />
                )}
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-xl text-center">
            <MaterialIcon name="search_off" className="text-[48px] text-outline-variant" />
            <p className="mt-md font-headline-md text-on-background">No courses found</p>
            <p className="mt-xs font-body-md text-on-surface-variant">
              Try a different search or category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
