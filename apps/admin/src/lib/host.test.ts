import { describe, expect, it } from "vitest";
import { DEFAULT_HOST_INFO, parseHostFromHeader } from "./host";

describe("parseHostFromHeader", () => {
  it("returns default when header missing", () => {
    expect(parseHostFromHeader(undefined)).toEqual(DEFAULT_HOST_INFO);
  });

  it("detects main portal domain", () => {
    expect(parseHostFromHeader("portal.allecto.app")).toMatchObject({
      isPortal: true,
      isCondoSubdomain: false,
      baseDomain: "allecto.app",
    });
  });

  it("detects condo subdomain", () => {
    expect(parseHostFromHeader("alpha.allecto.app")).toMatchObject({
      isPortal: false,
      isCondoSubdomain: true,
      subdomain: "alpha",
    });
  });

  it("handles localhost variants", () => {
    expect(parseHostFromHeader("localhost:3000")).toMatchObject({
      isLocal: true,
      baseDomain: "localhost",
      isPortal: true,
    });
  });

  it("treats unknown hosts as portal by default", () => {
    expect(parseHostFromHeader("custom.allecto.dev")).toMatchObject({
      baseDomain: "allecto.dev",
      isPortal: true,
    });
  });
});
