import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@test/utils/renderWithProviders";
import { PageHeader } from "./PageHeader";

const setup = () => {
  const user = userEvent.setup();
  const primary = vi.fn();
  const secondary = vi.fn();
  const result = renderWithProviders(
    <PageHeader
      title="Nova Ata"
      description="Envie uma ata para os moradores"
      breadcrumb={["Atas", "Nova"]}
      primaryAction={{ label: "Publicar", onClick: primary }}
      secondaryAction={{ label: "Cancelar", onClick: secondary }}
      contextPill={{ name: "Residencial Alpha", subdomain: "alpha" }}
    />,
  );
  return { user, primary, secondary, ...result };
};

describe("PageHeader", () => {
  it("shows breadcrumb, description and context pill", () => {
    const { getByText } = setup();
    expect(getByText("Atas")).toBeInTheDocument();
    expect(getByText("Nova Ata")).toBeInTheDocument();
    expect(getByText("Envie uma ata para os moradores")).toBeVisible();
    expect(getByText("Residencial Alpha")).toBeVisible();
    expect(getByText("(alpha)")).toBeVisible();
  });

  it("invokes actions when buttons are clicked", async () => {
    const { user, primary, secondary, getByRole } = setup();
    await user.click(getByRole("button", { name: "Cancelar" }));
    await user.click(getByRole("button", { name: "Publicar" }));
    expect(secondary).toHaveBeenCalledTimes(1);
    expect(primary).toHaveBeenCalledTimes(1);
  });
});
