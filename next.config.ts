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
      // Legacy marketing URLs
      { source: "/courses", destination: "/learn", permanent: false },
      { source: "/masterclass/raju-khatiwada", destination: "/ebooks", permanent: false },
    ];
  },
};

export default nextConfig;
