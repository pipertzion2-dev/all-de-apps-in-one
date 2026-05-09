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
  ],
};

export default nextConfig;
