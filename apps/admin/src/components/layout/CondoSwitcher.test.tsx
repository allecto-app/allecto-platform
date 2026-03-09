import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@test/utils/renderWithProviders";
import type { Doc } from "../../lib/convexGenerated";
import { CondoSwitcher } from "./CondoSwitcher";

const condos: Doc<"condos">[] = [
  {
    _id: "condo_1" as Doc<"condos">["_id"],
    _creationTime: Date.now(),
    name: "Residencial Alpha",
    subdomain: "alpha",
    branding: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "condo_2" as Doc<"condos">["_id"],
    _creationTime: Date.now(),
    name: "Residencial Beta",
    subdomain: "beta",
    branding: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe("CondoSwitcher", () => {
  it("renders placeholder when no condo selected", () => {
    const { getByText } = renderWithProviders(
      <CondoSwitcher condos={condos} selectedCondoId={null} onSelectCondo={() => {}} />,
    );
    expect(getByText("Select a condo...")).toBeVisible();
  });

  it("allows selecting and toggling condos", async () => {
    const onSelect = vi.fn();
    const { getByRole, getByText } = renderWithProviders(
      <CondoSwitcher condos={condos} selectedCondoId={condos[0]._id} onSelectCondo={onSelect} />,
    );
    const user = userEvent.setup();
    const trigger = getByRole("combobox");
    await user.click(trigger);
    await user.click(getByText(/Residencial Beta/));
    expect(onSelect).toHaveBeenCalledWith(condos[1]._id);
    await user.click(trigger);
    await user.click(getByText(/Residencial Beta/));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
