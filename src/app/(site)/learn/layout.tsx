import type { Metadata } from "next";
import { getPublicCms } from "@/lib/cms/public";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublicCms();
  const seo = cms.seo.learn;
  return {
    title: { absolute: seo.title || "Learn | Sikau Paisa" },
    description: seo.description,
    openGraph: {
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  };
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
