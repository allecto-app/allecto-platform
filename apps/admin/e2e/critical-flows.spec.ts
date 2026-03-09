import { test, expect, Page } from "@playwright/test";

const ADMIN_EMAIL =
  process.env.PLAYWRIGHT_ADMIN_EMAIL ??
  process.env.NEXT_PUBLIC_MOCK_ADMIN_EMAIL ??
  "admin@allecto.app";
const ADMIN_PASSWORD =
  process.env.PLAYWRIGHT_ADMIN_PASSWORD ??
  process.env.NEXT_PUBLIC_MOCK_ADMIN_PASSWORD ??
  "Password123";

async function selectCondo(page: Page, condoName = "Residencial Alpha") {
  await page.waitForFunction(() => {
    const win = window as unknown as {
      __CONVEX_MOCK_FIXTURES__?: { condos?: Array<{ name: string }> };
      __ADMIN_TEST_API__?: { selectCondo?: (condo: unknown) => void };
    };
    return (
      Array.isArray(win.__CONVEX_MOCK_FIXTURES__?.condos) &&
      typeof win.__ADMIN_TEST_API__?.selectCondo === "function"
    );
  });
  await page.evaluate((targetName) => {
    const win = window as unknown as {
      __CONVEX_MOCK_FIXTURES__?: { condos?: Array<Record<string, unknown>> };
      __ADMIN_TEST_API__?: { selectCondo?: (condo: Record<string, unknown> | null) => void };
    };
    const list = win.__CONVEX_MOCK_FIXTURES__?.condos ?? [];
    const condo =
      list.find((item) => typeof item.name === "string" && item.name.includes(targetName)) ??
      list[0] ??
      null;
    win.__ADMIN_TEST_API__?.selectCondo?.(condo);
  }, condoName);
  await expect(page.getByRole("button", { name: "Atas" })).toBeEnabled();
}

test.beforeEach(async ({ page }) => {
  page.on("console", (msg) => {
    console.log("[browser]", msg.type(), msg.text());
  });
  await page.addInitScript(() => {
    (window as unknown as { __USE_CONVEX_MOCKS__?: boolean }).__USE_CONVEX_MOCKS__ = true;
  });
});

async function login(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    (window as unknown as { __CONVEX_FIXTURES_RESET__?: () => void }).__CONVEX_FIXTURES_RESET__?.();
  });
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
}

test.describe.serial("Admin critical flows", () => {
  test("Flow 1 – Admin sign in redirects to dashboard", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Platform").first()).toBeVisible();
  });

  test("Flow 2 – Create Minute", async ({ page }) => {
    await login(page);
    await selectCondo(page);
    await page.getByRole("button", { name: "Atas" }).click();
    await expect(page.getByRole("heading", { name: "Atas" })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Nova Ata" }).click();
    await expect(page.getByRole("heading", { name: "Nova Ata" })).toBeVisible();
    await page.getByPlaceholder("Digite o título da ata").fill("Ata Extraordinária");
    await page.getByPlaceholder("Digite um resumo da ata").fill("Resumo automatizado para testes");
    await page.getByText("Selecione um documento recém-enviado").click();
    await page.getByRole("option", { name: "Ata inicial" }).click();
    await page.getByPlaceholder("Título do documento").fill("Documento para testes");
    await page.getByText("Selecione o prazo").click();
    await page.getByRole("option", { name: "3 dias" }).click();
    const publishButton = page.getByRole("button", { name: "Publicar" });
    await expect(publishButton).toBeEnabled();
    await publishButton.scrollIntoViewIfNeeded();
    await publishButton.click();
    const successToast = page.getByText("Ata publicada com sucesso!", { exact: true }).first();
    await expect(successToast).toBeVisible();
    await page.getByRole("button", { name: "Atas" }).click();
    await expect(page.getByRole("heading", { name: "Atas" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Carregando atas...", { exact: false })).toBeHidden({
      timeout: 10_000,
    });
    await expect(page.getByText("Ata Extraordinária")).toBeVisible({ timeout: 10_000 });
  });

  test("Flow 3 – Invite Syndic", async ({ page }) => {
    await login(page);
    await selectCondo(page);
    await page.getByRole("button", { name: "Moradores" }).click();
    await expect(page.getByRole("heading", { name: "Moradores" })).toBeVisible();
    await page.route("**/api/invites/create", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.getByRole("button", { name: "Convidar Síndico" }).click();
    await page.getByLabel("Nome (opcional)").fill("Carlos");
    await page.getByLabel(/^Email$/).fill("carlos+e2e@example.com");
    await page.getByRole("button", { name: "Enviar convite" }).click();
    const inviteToast = page.getByText("Convite enviado", { exact: true }).first();
    await expect(inviteToast).toBeVisible();
  });

  test("Flow 4 – Edit Resident", async ({ page }) => {
    await login(page);
    await selectCondo(page);
    await page.getByRole("button", { name: "Moradores" }).click();
    await page.getByLabel("Ver detalhes do morador").first().click();
    await expect(page.getByRole("heading", { name: /Síndico Alpha/ })).toBeVisible();
    await page.getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Telefone").fill("11912345678");
    const saveResidentButton = page.getByRole("button", { name: /^Salvar$/ });
    await expect(saveResidentButton).toBeEnabled();
    await saveResidentButton.evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    const residentToast = page
      .getByText("Morador atualizado com sucesso", { exact: true })
      .first();
    await expect(residentToast).toBeVisible();
  });

  test("Flow 5 – Edit Unit", async ({ page }) => {
    await login(page);
    await selectCondo(page);
    await page.getByRole("button", { name: "Unidades" }).click();
    await expect(page.getByRole("heading", { name: "Unidades" })).toBeVisible();
    await page.getByRole("button", { name: "Ver Detalhes" }).first().click();
    await expect(page.getByText("Informações da Unidade")).toBeVisible();
    await page.getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Bloco").fill("B");
    const saveUnitButton = page.getByRole("button", { name: "Salvar alterações" });
    await expect(saveUnitButton).toBeEnabled();
    await saveUnitButton.evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    const unitToast = page.getByText("Unidade atualizada com sucesso", { exact: true }).first();
    await expect(unitToast).toBeVisible();
  });

  test("Flow 6 – Mode restrictions", async ({ page }) => {
    await login(page);
    // Default super admin view shows platform links
    const platformHeading = page.getByRole("navigation").getByText("Platform", { exact: true }).first();
    await expect(platformHeading).toBeVisible();
    // Switch to tenant view
    const switcher = page.getByRole("combobox", { name: "Condo switcher" });
    await switcher.click();
    await page.getByRole("option", { name: "Residencial Beta" }).click();
    await expect(platformHeading).not.toBeVisible();
  });
});
