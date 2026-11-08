import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // A 404 page for addresses that match no page at all, which the language-based root layout cannot provide.
  experimental: { globalNotFound: true },
};

export default nextConfig;