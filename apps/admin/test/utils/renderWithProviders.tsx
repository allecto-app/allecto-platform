import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { HostProvider } from "../../src/lib/hostContext";
import { DEFAULT_HOST_INFO, type HostInfo } from "../../src/lib/host";

interface ProviderOptions {
  host?: Partial<HostInfo>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: ProviderOptions & { renderOptions?: RenderOptions },
) {
  const hostValue: HostInfo = { ...DEFAULT_HOST_INFO, ...(options?.host ?? {}) };
  function Wrapper({ children }: { children: ReactNode }) {
    return <HostProvider value={hostValue}>{children}</HostProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...(options?.renderOptions ?? {}) });
}
