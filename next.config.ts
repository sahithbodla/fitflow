import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Emits a minimal self-contained server bundle for the Docker image (Render).
  // Netlify's Next.js Runtime manages its own build output and is broken by
  // this option (known incompatibility — causes 404s / failed builds), so it
  // is skipped there. Netlify sets NETLIFY=true during its own builds.
  ...(process.env.NETLIFY ? {} : { output: "standalone" as const }),
  poweredByHeader: false,
  images: {
    // Logos are supplied as remote URLs in this MVP; there is no upload flow.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
