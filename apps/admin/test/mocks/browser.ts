import { vi } from "vitest";

declare global {
  interface Window {
    ResizeObserver: typeof ResizeObserver;
  }

  interface Element {
    scrollIntoView?: (arg?: boolean | ScrollIntoViewOptions) => void;
  }
}

const noop = () => {};

export function installBrowserMocks() {
  if (typeof window === "undefined") {
    return;
  }

  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addListener: noop,
      removeListener: noop,
      addEventListener: noop,
      removeEventListener: noop,
      onchange: null,
      dispatchEvent: () => false,
    }));
  }

  if (!("ResizeObserver" in window)) {
    class StubResizeObserver {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
    }
    // @ts-expect-error - assigning to readonly property for tests
    window.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
  }

  if (!("IntersectionObserver" in window)) {
    class StubIntersectionObserver {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
      takeRecords = () => [];
    }
    // @ts-expect-error - assigning to readonly property for tests
    window.IntersectionObserver = StubIntersectionObserver as unknown as typeof IntersectionObserver;
  }

  if (!window.scrollTo) {
    window.scrollTo = vi.fn();
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = noop;
  }

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }

  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = noop;
  }

  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = noop;
  }

  if (typeof HTMLFormElement !== "undefined") {
    HTMLFormElement.prototype.reportValidity = () => true;
    HTMLFormElement.prototype.checkValidity = () => true;
  }

  if (typeof HTMLInputElement !== "undefined") {
    HTMLInputElement.prototype.reportValidity = () => true;
    HTMLInputElement.prototype.checkValidity = () => true;
  }
}
