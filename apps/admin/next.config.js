const path = require("path");

const useMockConvex =
  process.env.NEXT_PUBLIC_USE_MOCK_CONVEX === "true" ||
  process.env.PLAYWRIGHT_TEST === "true" ||
  process.env.NODE_ENV === "test";

if (useMockConvex) {
  process.env.NEXT_PUBLIC_USE_MOCK_CONVEX = "true";
}

console.log("[next.config] useMockConvex:", useMockConvex, {
  NEXT_PUBLIC_USE_MOCK_CONVEX: process.env.NEXT_PUBLIC_USE_MOCK_CONVEX,
  PLAYWRIGHT_TEST: process.env.PLAYWRIGHT_TEST,
  NODE_ENV: process.env.NODE_ENV,
});
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  pageExtensions: ["tsx", "ts", "jsx", "js"],
  webpack: (config) => {
    if (useMockConvex) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias["convex/react"] = path.resolve(
        __dirname,
        "./src/test/mocks/runtime/convexReactMock.tsx",
      );
    }
    return config;
  },
};

module.exports = nextConfig;
