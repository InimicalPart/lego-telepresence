import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    distDir: "build",
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost"],
        },
    },
    poweredByHeader: false,
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    devIndicators: {
        appIsrStatus: false,
    },
};

export default nextConfig;