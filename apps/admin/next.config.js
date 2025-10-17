/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  pageExtensions: ["tsx", "ts", "jsx", "js"],
};

module.exports = nextConfig;
