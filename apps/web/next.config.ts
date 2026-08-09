import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep development HMR files separate from production build output.
  // This prevents concurrent `next dev` and `next build` runs from
  // invalidating each other's manifests in synced/non-ASCII workspaces.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};
export default nextConfig;
