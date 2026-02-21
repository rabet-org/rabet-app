import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "jsonwebtoken",
    "bcryptjs",
    "cloudinary",
    "resend",
  ],
};

export default nextConfig;
