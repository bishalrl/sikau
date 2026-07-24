import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/courses", destination: "/ebooks", permanent: false },
      { source: "/masterclass/raju-khatiwada", destination: "/ebooks", permanent: false },
      { source: "/learn", destination: "/ebooks", permanent: false },
      { source: "/learn/:path*", destination: "/ebooks", permanent: false },
      { source: "/quiz", destination: "/ebooks", permanent: false },
      { source: "/dashboard", destination: "/ebooks", permanent: false },
      { source: "/dashboard/:path*", destination: "/ebooks", permanent: false },
      { source: "/study", destination: "/ebooks", permanent: false },
      { source: "/study/:path*", destination: "/ebooks", permanent: false },
      { source: "/payment/:path*", destination: "/ebooks", permanent: false },
    ];
  },
};

export default nextConfig;
