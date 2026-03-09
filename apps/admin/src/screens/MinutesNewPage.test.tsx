import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@test/utils/renderWithProviders";
import { mockConvexMutation, mockConvexQuery } from "@test/mocks/convex";
import { api } from "../lib/convexGenerated";
import { MinutesNewPage } from "./MinutesNewPage";

vi.mock("../hooks/useDocuments", () => ({
  useDocuments: () => ({
    documents: [
      {
        _id: "doc_1",
        title: "Ata teste",
        createdAt: Date.now(),
      },
    ],
    isLoading: false,
  }),
}));

vi.mock("../hooks/useUsageSummary", () => ({
  useUsageSummary: () => ({
    summary: {
      active: true,
      tierKey: "plus",
      unitsOk: true,
      remaining: 2,
      usage: { monthKey: "2026-03", assembliesCount: 0 },
      unitsCount: 10,
      unitValidationReason: null,
    },
    isLoading: false,
    blockReason: null,
    remainingLabel: "Plano Plus · 2 assembleias restantes",
  }),
  assertCanCreateAssembly: () => undefined,
}));

vi.mock("../components/documents/PdfUploader", () => ({
  PdfUploader: () => null,
}));

vi.mock("../components/documents/ViewPdfButton", () => ({
  ViewPdfButton: () => null,
}));

const condo = {
  _id: "condo_1" as const,
  _creationTime: Date.now(),
  name: "Residencial Alpha",
  subdomain: "alpha",
  branding: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("MinutesNewPage", () => {
  it("publishes a minute when required fields are filled", async () => {
    mockConvexQuery(api.residents.list, () => [
      {
        _id: "resident_1",
        _creationTime: Date.now(),
        condoId: condo._id,
        name: "Síndico",
        email: "sindico@example.com",
        phone: null,
        role: "syndic",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
    const publishMinute = vi.fn().mockResolvedValue({ ok: true });
    mockConvexMutation(api.minutes.publish, publishMinute);

    const { getByLabelText, getByText, getByRole } = renderWithProviders(
      <MinutesNewPage condo={condo} sessionToken="token" onNavigate={vi.fn()} />,
    );

    const user = userEvent.setup();
    await user.type(getByLabelText("Título"), "Ata extraordinária");
    await user.type(getByLabelText("Resumo"), "Discussão sobre orçamento");
    await user.click(getByText("Selecione o prazo"));
    await user.click(getByText("3 dias"));
    await user.click(getByText("Selecione um documento recém-enviado"));
    await user.click(getByText("Ata teste"));
    await user.click(getByRole("button", { name: "Publicar" }));

    expect(publishMinute).toHaveBeenCalledWith(
      expect.objectContaining({
        condoId: condo._id,
        title: "Ata extraordinária",
        summary: "Discussão sobre orçamento",
      }),
    );
  });
});
