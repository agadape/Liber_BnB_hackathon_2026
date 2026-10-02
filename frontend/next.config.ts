import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Separate local buyer/merchant origins for test-wallet UI verification.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
