import type { NextConfig } from "next";

const config: NextConfig = {
  basePath: "/app",
  output: "standalone",
  poweredByHeader: false,
  outputFileTracingExcludes: { "/*": ["./.env*", "./.data/**/*", "./tests/**/*", "./docs/**/*", "./.git/**/*"] },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

export default config;
