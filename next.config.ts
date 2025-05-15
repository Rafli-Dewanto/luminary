import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push("pspdfkit");
    }

    return config;
  },
  experimental: {
    ppr: true, // Enable Parallel Router Prefetching (experimental)
    turbo: {
      resolveAlias: {
        pspdfkit: "pspdfkit",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
    ],
  },
};

export default nextConfig;
