/** @type {import('next').NextConfig} */
import { SECURITY_HEADERS } from "./lib/security-headers.mjs";

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["drizzle-orm", "pg"],
  allowedDevOrigins: ["*.vercel.app", "127.0.0.1", "localhost", "192.168.*", "10.*", "172.*"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/sitemap/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }],
      },
      {
        source: "/robots.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/sitemap.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }],
      },
      {
        source: "/pyracrypt-sitemap.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }],
      },
      {
        source: "/security-sitemap.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/clutety", destination: "/cyber-security-mini-apps", permanent: true },
      { source: "/clutety/:path*", destination: "/cyber-security-mini-apps", permanent: true },
      { source: "/pyracrypt", destination: "/cyber-security-mini-apps", permanent: true },
      { source: "/pyracrypt/:path*", destination: "/cyber-security-mini-apps", permanent: true },
      { source: "/clutter", destination: "/cyber-security-mini-apps", permanent: true },
      { source: "/clutter/:path*", destination: "/cyber-security-mini-apps", permanent: true },
      {
        source: "/clutety-shell",
        destination: "/cyber-security-mini-apps",
        permanent: true,
      },
      {
        source: "/clutety-shell/:path*",
        destination: "/cyber-security-mini-apps",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
