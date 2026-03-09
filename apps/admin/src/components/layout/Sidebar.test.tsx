import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@test/utils/renderWithProviders";
import type { Doc } from "../../lib/convexGenerated";
import { Sidebar } from "./Sidebar";

const condo: Doc<"condos"> = {
  _id: "condo_1" as Doc<"condos">["_id"],
  _creationTime: Date.now(),
  name: "Residencial Horizon",
  subdomain: "horizon",
  branding: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("Sidebar navigation", () => {
  it("shows platform and tenant sections in super admin mode", () => {
    const { getByText } = renderWithProviders(
      <Sidebar
        currentPage="dashboard"
        onNavigate={() => {}}
        collapsed={false}
        onToggleCollapse={() => {}}
        mode="platform"
        selectedCondo={condo}
      />,
    );
    expect(getByText("Platform")).toBeVisible();
    expect(getByText("Tenant Views")).toBeVisible();
    expect(getByText("Condomínios")).toBeEnabled();
    expect(getByText("Atas")).toBeEnabled();
  });

  it("disables tenant entries when no condo is selected", () => {
    const { getByRole } = renderWithProviders(
      <Sidebar
        currentPage="dashboard"
        onNavigate={() => {}}
        collapsed={false}
        onToggleCollapse={() => {}}
        mode="platform"
        selectedCondo={null}
      />,
    );
    expect(getByRole("button", { name: /Atas/i })).toBeDisabled();
  });

  it("hides platform group for tenant admins", async () => {
    const onNavigate = vi.fn();
    const { queryByText, getByRole } = renderWithProviders(
      <Sidebar
        currentPage="minutes"
        onNavigate={onNavigate}
        collapsed={false}
        onToggleCollapse={() => {}}
        mode="tenant"
        selectedCondo={condo}
      />,
    );
    expect(queryByText("Platform")).toBeNull();
    const user = userEvent.setup();
    await user.click(getByRole("button", { name: "Moradores" }));
    expect(onNavigate).toHaveBeenCalledWith("residents");
  });
});
