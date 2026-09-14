import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "commondatastorage.googleapis.com" },
      { protocol: "https", hostname: "api.venify.xyz" },
      { protocol: "https", hostname: "x.venify.xyz" },
    ],
  },
  ...(isGithubPages
    ? {
        basePath: "/sites",
        assetPrefix: "/sites/",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
