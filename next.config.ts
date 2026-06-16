import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — a parent pnpm-lock.yaml exists higher up.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
