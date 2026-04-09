import type { NextConfig } from "next";
import path from "path";

const isStaticExport = process.env.STATIC_EXPORT === "1";
const projectRoot = path.resolve(process.cwd(), "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
  ...(isStaticExport && {
    output: "export",
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;
