import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["pg", "jsonwebtoken", "bcryptjs", "cloudinary"],
};

export default nextConfig;
