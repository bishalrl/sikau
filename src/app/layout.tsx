import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "../fonts/inter-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/inter-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/inter-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = localFont({
  src: [
    { path: "../fonts/plus-jakarta-sans-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sikau Paisa | Fintech Academy",
  description:
    "Master personal finance, investing, and digital payments with Nepal's gamified fintech learning platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} scroll-smooth antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-x-hidden bg-background font-body-md text-on-surface">
        {children}
      </body>
    </html>
  );
}
