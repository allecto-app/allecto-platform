import React from "react";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { installBrowserMocks } from "./test/mocks/browser";
import { resetConvexMocks } from "./src/test/mocks/runtime/convexReactMock";
import * as nextNavigationMock from "./test/mocks/nextNavigation";
import * as sonnerMock from "./test/mocks/sonner";
import { resetRouterMocks } from "./test/mocks/nextNavigation";

installBrowserMocks();

vi.mock("next/navigation", () => nextNavigationMock);
vi.mock("sonner", () => sonnerMock);
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { alt: "", ...props }),
}));

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL ??= "http://localhost:9999/mock";
});

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
  resetConvexMocks();
  resetRouterMocks();
});
