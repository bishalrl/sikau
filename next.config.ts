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
      { source: "/courses", destination: "/learn", permanent: true },
      { source: "/masterclass/raju-khatiwada", destination: "/learn", permanent: true },
    ];
  },
};

export default nextConfig;
