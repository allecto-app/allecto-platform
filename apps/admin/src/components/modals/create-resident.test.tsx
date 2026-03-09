import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import { renderWithProviders } from "@test/utils/renderWithProviders";
import { mockConvexMutation } from "@test/mocks/convex";
import { api } from "../../lib/convexGenerated";
import { CreateResidentModal } from "./create-resident";

const condoId = "condo_1" as Parameters<typeof CreateResidentModal>[0]["condoId"];

const renderModal = () =>
  renderWithProviders(
    <CreateResidentModal open onOpenChange={vi.fn()} condoId={condoId} condoName="Alpha" />,
  );

describe("CreateResidentModal", () => {
  it("shows validation messages when required fields are empty", async () => {
    const { getByRole, findByText } = renderModal();
    const user = userEvent.setup();
    await user.click(getByRole("button", { name: "Criar morador" }));
    expect(await findByText("Informe o nome do morador")).toBeVisible();
    expect(await findByText("Informe o e-mail")).toBeVisible();
  });

  it("submits the convex mutation with normalized payload", async () => {
    const createResident = vi.fn().mockResolvedValue({ ok: true });
    mockConvexMutation(api.residents.create, createResident);
    const { getByLabelText, getByRole } = renderModal();
    const user = userEvent.setup();
    await user.type(getByLabelText(/Nome/), " Ana Maria ");
    await user.type(getByLabelText(/E-mail/), " ana@example.com ");
    await user.type(getByLabelText(/Telefone/), "1199999999");
    await user.click(getByRole("button", { name: "Criar morador" }));
    await waitFor(() =>
      expect(createResident).toHaveBeenCalledWith(
        expect.objectContaining({
          condoId,
          name: "Ana Maria",
          email: "ana@example.com",
        }),
      ),
    );
  });
});
