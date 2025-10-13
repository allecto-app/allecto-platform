import type { AppProps } from "next/app";
import { ConvexProvider } from "convex/react";

import "../styles/globals.css";
import { convex } from "../lib/convexClient";

export default function AdminApp({ Component, pageProps }: AppProps) {
  return (
    <ConvexProvider client={convex}>
      <Component {...pageProps} />
    </ConvexProvider>
  );
}
