import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Content is local (markdown + JSON), so the whole site can be statically
  // generated. No database, no runtime data fetching.
};

export default nextConfig;
