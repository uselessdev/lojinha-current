import "./src/env.mjs";

/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverActions: true,
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};

export default nextConfig;
