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
      { source: "/masterclass/raju-khatiwada", destination: "/ebooks/nepse-trading-guide", permanent: false },
      {
        source: "/ebooks/nepse-trading-community",
        destination: "/ebooks/nepse-trading-guide?type=community",
        permanent: false,
      },
      {
        source: "/ebooks/nepse-trading-community/:path*",
        destination: "/ebooks/nepse-trading-guide/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
