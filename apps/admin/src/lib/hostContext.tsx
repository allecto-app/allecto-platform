"use client";

import { createContext, useContext } from "react";
import type { HostInfo } from "./host";
import { DEFAULT_HOST_INFO, detectClientHost } from "./host";

const HostContext = createContext<HostInfo>(DEFAULT_HOST_INFO);

export function HostProvider({
  value,
  children,
}: {
  value: HostInfo;
  children: React.ReactNode;
}) {
  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}

export function useHostInfo(): HostInfo {
  const info = useContext(HostContext);
  if (info.rawHost === DEFAULT_HOST_INFO.rawHost) {
    return detectClientHost();
  }
  return info;
}
