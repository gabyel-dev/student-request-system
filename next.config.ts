import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Leave room for multipart boundaries and field metadata above the
      // 20 MB combined proof-file limit.
      bodySizeLimit: "21mb",
    },
  },
};

export default nextConfig;
