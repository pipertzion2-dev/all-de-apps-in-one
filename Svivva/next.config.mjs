/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["drizzle-orm", "pg"],
  allowedDevOrigins: ["*.vercel.app", "127.0.0.1", "localhost", "192.168.*", "10.*", "172.*"],
};

export default nextConfig;
