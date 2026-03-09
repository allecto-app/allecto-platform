import { vi } from "vitest";

interface MockRouter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
}

const createRouter = (): MockRouter => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
});

let router = createRouter();
let pathname = "/";
let searchParams = new URLSearchParams();
let params: Record<string, string> = {};

export const useRouter = () => router;
export const usePathname = () => pathname;
export const useParams = () => params;
export const useSearchParams = () => searchParams;
export const redirect = vi.fn();
export const notFound = vi.fn();

export function setMockRouter(overrides: Partial<Record<keyof MockRouter, unknown>>) {
  router = { ...createRouter(), ...overrides } as MockRouter;
}

export function setMockPathname(nextPath: string) {
  pathname = nextPath;
}

export function setMockSearchParams(init: string | URLSearchParams | Record<string, string>) {
  if (init instanceof URLSearchParams) {
    searchParams = init;
    return;
  }
  if (typeof init === "string") {
    searchParams = new URLSearchParams(init);
    return;
  }
  const entries = Object.entries(init);
  searchParams = new URLSearchParams(entries);
}

export function setMockParams(nextParams: Record<string, string>) {
  params = nextParams;
}

export function resetRouterMocks() {
  router = createRouter();
  pathname = "/";
  searchParams = new URLSearchParams();
  params = {};
  redirect.mockReset();
  notFound.mockReset();
}
