/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["drizzle-orm", "pg", "stripe-replit-sync"],
  allowedDevOrigins: [
    "*.replit.dev",
    "*.kirk.replit.dev",
    "*.replit.app",
    "*.vercel.app",
    "127.0.0.1",
    "localhost",
    // Same-Wi‑Fi device testing (Orbit / Next dev on LAN)
    "192.168.*",
    "10.*",
    "172.*",
  ],
};

export default nextConfig;
