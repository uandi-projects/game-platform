import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Optional: Configure experimental features if needed
  experimental: {
    // Enable if you need server actions or other experimental features
  },
};

export default nextConfig;
