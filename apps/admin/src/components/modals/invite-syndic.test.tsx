import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@test/utils/renderWithProviders";
import { InviteSyndicModal } from "./invite-syndic";
import { toast } from "sonner";
import { waitFor } from "@testing-library/react";

describe("InviteSyndicModal", () => {
  it("disables submission when no condo is selected", () => {
    const { getByRole } = renderWithProviders(
      <InviteSyndicModal open onOpenChange={vi.fn()} condoId={null} condoName="Alpha" />,
    );
    expect(getByRole("button", { name: "Enviar convite" })).toBeDisabled();
  });

  it("calls API and closes on success", async () => {
    const onOpenChange = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    }) as typeof fetch;
    const { getByLabelText, getByRole } = renderWithProviders(
      <InviteSyndicModal open onOpenChange={onOpenChange} condoId="condo_1" condoName="Alpha" />,
    );
    const user = userEvent.setup();
    await user.type(getByLabelText(/Nome/), "Carlos");
    await user.type(getByLabelText(/^Email/), "carlos@example.com");
    await user.click(getByRole("button", { name: "Enviar convite" }));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/invites/create",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Convite enviado"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
