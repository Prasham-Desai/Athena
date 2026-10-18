import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Bridge Cloudflare bindings (D1, KV, etc.) into the local Next.js dev server
// so that getCloudflareContext() works during `next dev`.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };
    return config;
  },
};

// Multi-year Athena system enabled
export default nextConfig;
