import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn | Sikau Paisa",
  description:
    "Explore Raju Khatiwada's Personal Finance Masterclass and all Sikau Paisa courses on budgeting, investing, and digital finance.",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
