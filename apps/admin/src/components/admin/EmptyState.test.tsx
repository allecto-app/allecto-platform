import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@test/utils/renderWithProviders";
import { Users } from "lucide-react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title, description and actions", async () => {
    const primary = vi.fn();
    const secondary = vi.fn();
    const { getByText, getByRole } = renderWithProviders(
      <EmptyState
        icon={Users}
        title="Nenhum morador"
        description="Cadastre um novo morador para começar."
        primaryAction={{ label: "Novo Morador", onClick: primary }}
        secondaryAction={{ label: "Voltar", onClick: secondary }}
      />,
    );
    expect(getByText("Nenhum morador")).toBeVisible();
    const user = userEvent.setup();
    await user.click(getByRole("button", { name: "Voltar" }));
    await user.click(getByRole("button", { name: "Novo Morador" }));
    expect(secondary).toHaveBeenCalledTimes(1);
    expect(primary).toHaveBeenCalledTimes(1);
  });
});
