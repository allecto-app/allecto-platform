import "server-only";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}
const CONVEX_URL: string = convexUrl;

export function createServerConvexClient() {
  return new ConvexHttpClient(CONVEX_URL);
}
