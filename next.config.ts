import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the root on this app. bunx nests the package inside node_modules,
  // and an ancestor lockfile would make Turbopack ignore the app.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
