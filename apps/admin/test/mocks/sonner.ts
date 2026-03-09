import { vi } from "vitest";

const buildToastFn = () => vi.fn();

export const toast = {
  success: buildToastFn(),
  error: buildToastFn(),
  info: buildToastFn(),
  warning: buildToastFn(),
};

export function Toaster() {
  return null;
}
