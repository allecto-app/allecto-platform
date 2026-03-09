"use client";

import type { ReactNode } from "react";
import { ConvexProvider } from "convex/react";
import { convex } from "../src/lib/convexClient";
import { Toaster } from "../src/components/ui/sonner";
import type { HostInfo } from "../src/lib/host";
import { HostProvider } from "../src/lib/hostContext";
import { ensureConvexMockData } from "../src/test/fixtures/registerConvexMocks";

ensureConvexMockData();

export function Providers({ children, host }: { children: ReactNode; host: HostInfo }) {
  return (
    <HostProvider value={host}>
      <ConvexProvider client={convex}>
        {children}
        <Toaster />
      </ConvexProvider>
    </HostProvider>
  );
}
