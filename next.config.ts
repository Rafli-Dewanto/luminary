import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure PSPDFKit is included in the client build
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        pspdfkit: require.resolve("pspdfkit"),
      };
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
