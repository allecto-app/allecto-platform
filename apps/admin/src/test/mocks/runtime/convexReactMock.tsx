"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

type QueryHandler = (args: any) => any;
type MutationHandler = (args: any) => any;

type MockControls = {
  setQuery: (ref: object, handler: QueryHandler, label?: string) => void;
  setMutation: (ref: object, handler: MutationHandler, label?: string) => void;
  setAction: (ref: object, handler: MutationHandler, label?: string) => void;
  reset: () => void;
};

let queryHandlers = new WeakMap<object, QueryHandler>();
let mutationHandlers = new WeakMap<object, MutationHandler>();
let actionHandlers = new WeakMap<object, MutationHandler>();
let referenceLabels = new WeakMap<object, string>();
const queryHandlersByLabel = new Map<string, QueryHandler>();
const mutationHandlersByLabel = new Map<string, MutationHandler>();
const actionHandlersByLabel = new Map<string, MutationHandler>();
const queryHandlersBySignature = new Map<string, QueryHandler>();

let version = 0;
const subscribers = new Set<() => void>();

const subscribe = (listener: () => void) => {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
};

const getVersion = () => version;

const notify = () => {
  version += 1;
  subscribers.forEach((listener) => listener());
};

const getRefLabel = (ref: unknown) => {
  const functionNameSymbol = Symbol.for("functionName");
  if (
    ref &&
    (typeof ref === "object" || typeof ref === "function") &&
    typeof (ref as Record<symbol, unknown>)[functionNameSymbol] === "string"
  ) {
    const raw = (ref as Record<symbol, unknown>)[functionNameSymbol] as string;
    return raw.replace(/[:/]/g, ".");
  }
  if (ref && typeof ref === "object") {
    const manualLabel = referenceLabels.get(ref as object);
    if (manualLabel) {
      return manualLabel;
    }
  }
  if (ref && typeof ref === "object") {
    const mockKey = (ref as Record<string | symbol, unknown>).__mockKey;
    if (typeof mockKey === "string" && mockKey.length > 0) {
      return mockKey;
    }
  }
  if (ref && typeof ref === "object") {
    const label =
      (ref as Record<string, unknown>)._name ?? (ref as Record<string, unknown>).name;
    if (typeof label === "string" && label.length > 0) {
      return label;
    }
    if (label != null) {
      try {
        return String(label);
      } catch {
        // ignore and fall through
      }
    }
  }
  return "unidentified convex function";
};

const getRefSignature = (ref: unknown) => {
  if (typeof ref === "function") {
    try {
      return ref.toString();
    } catch {
      return null;
    }
  }
  return null;
};

console.info("[convexMock] runtime polyfill loaded");

export function ConvexProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export class ConvexReactClient {
  constructor(public readonly address: string) {}
}

export function useQuery<TResult>(reference: object, args: any): TResult | undefined {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  if (args === "skip") {
    return undefined;
  }
  const label = getRefLabel(reference);
  const signature = getRefSignature(reference);
  let handler =
    queryHandlers.get(reference) ??
    queryHandlersByLabel.get(label) ??
    (signature ? queryHandlersBySignature.get(signature) : undefined);
  if (!handler) {
    const props =
      reference && typeof reference === "object" ? Object.getOwnPropertyNames(reference) : [];
    let signature: string | null = null;
    try {
      signature = String(reference);
    } catch {
      signature = null;
    }
    console.warn("[convexMock] missing query handler for", label, { props, signature });
  }
  return handler ? handler(args) : undefined;
}

export function useMutation(reference: object) {
  return async (args: any) => {
    const handler =
      mutationHandlers.get(reference) ?? mutationHandlersByLabel.get(getRefLabel(reference));
    if (!handler) {
      throw new Error(`Missing mock mutation handler for ${getRefLabel(reference)}`);
    }
    const result = await handler(args);
    notify();
    return result;
  };
}

export function useAction(reference: object) {
  return async (args: any) => {
    const handler =
      actionHandlers.get(reference) ?? actionHandlersByLabel.get(getRefLabel(reference));
    if (!handler) {
      throw new Error(`Missing mock action handler for ${getRefLabel(reference)}`);
    }
    const result = await handler(args);
    notify();
    return result;
  };
}

export const ConvexProviderWithAuth = ConvexProvider;

export function useConvexAuth() {
  return { isAuthenticated: true, isLoading: false };
}

export function mockConvexQuery(reference: object, handler: QueryHandler, label?: string) {
  const derivedLabel = getRefLabel(reference);
  const key = derivedLabel === "unidentified convex function" && label ? label : derivedLabel;
  referenceLabels.set(reference, key);
  const signature = getRefSignature(reference);
  if (signature) {
    queryHandlersBySignature.set(signature, handler);
  }
  console.info("[convexMock] mock query registered:", key);
  queryHandlers.set(reference, handler);
  queryHandlersByLabel.set(key, handler);
  if (label && label !== key) {
    queryHandlersByLabel.set(label, handler);
  }
  notify();
}

export function mockConvexMutation(reference: object, handler: MutationHandler, label?: string) {
  const key = label ?? getRefLabel(reference);
  console.info("[convexMock] mock mutation registered:", key);
  mutationHandlers.set(reference, handler);
  mutationHandlersByLabel.set(key, handler);
}

export function mockConvexAction(reference: object, handler: MutationHandler, label?: string) {
  const key = label ?? getRefLabel(reference);
  console.info("[convexMock] mock action registered:", key);
  actionHandlers.set(reference, handler);
  actionHandlersByLabel.set(key, handler);
}

export function resetConvexMocks() {
  queryHandlers = new WeakMap();
  mutationHandlers = new WeakMap();
  actionHandlers = new WeakMap();
  referenceLabels = new WeakMap();
  queryHandlersBySignature.clear();
  queryHandlersByLabel.clear();
  mutationHandlersByLabel.clear();
  actionHandlersByLabel.clear();
  version = 0;
  notify();
}

const attachGlobalControls = () => {
  if (typeof globalThis === "undefined") return;
  const controls: MockControls = {
    setQuery: mockConvexQuery,
    setMutation: mockConvexMutation,
    setAction: mockConvexAction,
    reset: resetConvexMocks,
  };
  (globalThis as Record<string, unknown>).__CONVEX_MOCKS__ = controls;
};

attachGlobalControls();
