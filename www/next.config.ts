import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    distDir: "build",
    experimental: {
        serverActions: {
            allowedOrigins: ["qrlink.newseed.se", "localhost"],
        },
    },
    poweredByHeader: false,
    logging: {
        fetches: {
            fullUrl: true,
        },
    }
};

export default nextConfig;
