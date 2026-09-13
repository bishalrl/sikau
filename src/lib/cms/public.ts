import { cache } from "react";
import { listCmsRecords, type CmsRecord } from "@/lib/cms/store";

export type CmsLink = { label: string; href: string };
export type CmsIconItem = { icon: string; label: string };
export type CmsStat = { value: string; label: string; icon: string };

export type PublicCms = {
  site: Record<string, string>;
  seo: {
    site: Record<string, string>;
    home: Record<string, string>;
    learn: Record<string, string>;
  };
  nav: CmsLink[];
  footerQuick: { heading: string; links: CmsLink[] };
  footerResources: { heading: string; links: CmsLink[] };
  footerLegal: CmsLink[];
  footerNewsletterHeading: string;
  social: Array<{ label: string; href: string; icon: string }>;
  sections: Record<string, { enabled: boolean; data: Record<string, string>; items: CmsRecord[] }>;
};

function children(records: CmsRecord[], parentKey: string) {
  return records
    .filter((record) => record.parentKey === parentKey && record.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function links(records: CmsRecord[], parentKey: string): CmsLink[] {
  return children(records, parentKey).map((item) => ({
    label: item.data.label || item.label,
    href: item.data.href || "#",
  }));
}

function section(records: CmsRecord[], key: string) {
  const found = records.find((record) => record.key === key);
  return {
    enabled: found?.enabled ?? true,
    data: found?.data ?? {},
    items: children(records, key),
  };
}

export const getPublicCms = cache(async function getPublicCms(): Promise<PublicCms> {
  const records = await listCmsRecords();
  const site = records.find((record) => record.key === "site.settings")?.data ?? {};
  return {
    site,
    seo: {
      site: records.find((record) => record.key === "seo.site")?.data ?? {},
      home: records.find((record) => record.key === "seo.home")?.data ?? {},
      learn: records.find((record) => record.key === "seo.learn")?.data ?? {},
    },
    nav: links(records, "site.nav"),
    footerQuick: {
      heading: records.find((record) => record.key === "site.footer.quick")?.data.heading || "Quick Links",
      links: links(records, "site.footer.quick"),
    },
    footerResources: {
      heading: records.find((record) => record.key === "site.footer.resources")?.data.heading || "Resources",
      links: links(records, "site.footer.resources"),
    },
    footerLegal: links(records, "site.footer.legal"),
    footerNewsletterHeading: records.find((record) => record.key === "site.footer.newsletter")?.data.heading || "Newsletter",
    social: children(records, "site.social").map((item) => ({
      label: item.data.label || item.label,
      href: item.data.href || "#",
      icon: item.data.icon || "link",
    })),
    sections: Object.fromEntries(
      records.filter((record) => record.kind === "section").map((record) => [record.key, section(records, record.key)]),
    ),
  };
});

export function parseLessons(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, duration] = line.split("|").map((part) => part.trim());
      return { title, duration: duration || "" };
    })
    .filter((lesson) => lesson.title);
}
