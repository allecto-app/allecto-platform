"use client";

import type { ReactNode } from "react";
import { ConvexProvider } from "convex/react";
import { convex } from "../src/lib/convexClient";
import { Toaster } from "../src/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
      <Toaster />
    </ConvexProvider>
  );
}
