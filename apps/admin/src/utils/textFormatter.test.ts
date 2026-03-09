import { describe, expect, it } from "vitest";
import { notificationFormatter, roleFormatter } from "./textFormatter";

describe("roleFormatter", () => {
  it("maps known roles to localized labels", () => {
    expect(roleFormatter("resident")).toBe("Morador");
    expect(roleFormatter("syndic")).toBe("Síndico");
    expect(roleFormatter("manager")).toBe("Gestor");
    expect(roleFormatter("council")).toBe("Conselheiro");
  });

  it("returns undefined for unsupported roles", () => {
    expect(roleFormatter("unknown" as string)).toBeUndefined();
  });
});

describe("notificationFormatter", () => {
  it("maps templates to human-friendly labels", () => {
    expect(notificationFormatter("convocation")).toBe("Convocação");
    expect(notificationFormatter("reminderD2")).toBe("Lembrete D2");
    expect(notificationFormatter("closed")).toBe("Fechamento");
  });

  it("falls back to undefined when template is missing", () => {
    expect(notificationFormatter("oops" as string)).toBeUndefined();
  });
});
