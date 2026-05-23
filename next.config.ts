import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

export default nextConfig;
