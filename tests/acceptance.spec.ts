import { test, expect, type Page } from "@playwright/test";

const ADMIN = { email: "admin@demo.test", password: "demo1234" };

// Logs in and waits for the post-login redirect so the session cookie is set
// before any subsequent navigation. Use only with valid credentials.
async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard");
}

function csvBuffer(content: string) {
  return Buffer.from(content, "utf-8");
}

async function uploadCsv(page: Page, filename: string, content: string) {
  await page.goto("/upload");
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: filename, mimeType: "text/csv", buffer: csvBuffer(content) });
  await expect(page.getByTestId("upload-result")).toBeVisible();
}

// AC1: Visiting /dashboard while logged out redirects to /login; seeded credentials grant access.
test("dashboard is gated and seeded credentials grant access", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  await login(page);
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

// AC2: Uploading a sample CSV returns parsed column names + row count within seconds and persists it.
test("uploading a CSV returns parsed columns and row count", async ({ page }) => {
  await login(page);
  await uploadCsv(
    page,
    "sales-ac2.csv",
    "region,units,revenue\nNorth,10,100\nSouth,20,250\nEast,5,60\n",
  );

  const result = page.getByTestId("upload-result");
  await expect(result).toContainText("region");
  await expect(result).toContainText("units");
  await expect(result).toContainText("revenue");
  await expect(result).toContainText("Rows parsed: 3");

  // Persisted: it now shows up on the dashboard.
  await page.goto("/dashboard");
  await expect(page.getByTestId("dataset-select")).toContainText("sales-ac2.csv");
});

// AC3: /dashboard shows accurate stat cards, a chart, and a sortable/paginated table.
test("dashboard shows stat cards, a chart, and a sortable paginated table", async ({ page }) => {
  await login(page);

  const lines = ["region,units,revenue"];
  for (let i = 1; i <= 12; i++) lines.push(`Region${i},${i},${i * 100}`);
  await uploadCsv(page, "dash-ac3.csv", lines.join("\n") + "\n");

  await page.goto("/dashboard?dataset=latest");
  // The freshly uploaded dataset is the default (newest first).
  await expect(page.getByTestId("stat-rows")).toContainText("12");
  await expect(page.getByTestId("stat-columns")).toContainText("3");
  await expect(page.getByTestId("chart")).toBeVisible();

  const table = page.getByTestId("data-table");
  await expect(table).toBeVisible();

  // Paginated: 10 rows on page 1 of 2.
  await expect(page.getByTestId("page-indicator")).toContainText("Page 1 of 2");
  await expect(table.locator("tbody tr")).toHaveCount(10);
  await page.getByRole("button", { name: /^next$/i }).click();
  await expect(page.getByTestId("page-indicator")).toContainText("Page 2 of 2");
  await expect(table.locator("tbody tr")).toHaveCount(2);

  // Sortable: ascending by revenue puts the smallest value first (Region1 = 100).
  await table.getByRole("button", { name: /revenue/i }).click();
  await expect(table.locator("tbody tr").first()).toContainText("Region1");
});

// AC4: /admin lists every dataset and deleting one removes it from the dashboard.
test("admin lists datasets and deleting one removes it everywhere", async ({ page }) => {
  await login(page);
  const filename = "admin-ac4.csv";
  await uploadCsv(page, filename, "city,score\nAlpha,5\nBeta,9\nGamma,7\n");

  await page.goto("/admin");
  const row = page.getByTestId("admin-row").filter({ hasText: filename });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: /delete/i }).click();
  await expect(page.getByTestId("admin-row").filter({ hasText: filename })).toHaveCount(0);

  // Gone from the dashboard's dataset list too.
  await page.goto("/dashboard");
  const selector = page.getByTestId("dataset-select");
  if (await selector.count()) {
    await expect(selector).not.toContainText(filename);
  }
});

// AC5: The whole flow runs end-to-end (login -> upload -> dashboard -> admin) with no manual setup.
test("full flow runs end to end", async ({ page }) => {
  await login(page);
  const filename = "journey-ac5.csv";
  await uploadCsv(page, filename, "product,qty,price\nWidget,3,9.5\nGadget,7,12\n");

  await page.goto("/dashboard");
  await expect(page.getByTestId("dataset-select")).toContainText(filename);
  await expect(page.getByTestId("stat-rows")).toContainText("2");
  await expect(page.getByTestId("data-table")).toContainText("Widget");

  await page.goto("/admin");
  await expect(page.getByTestId("admin-row").filter({ hasText: filename })).toBeVisible();
});

// Edge case: invalid credentials are rejected and do not grant access.
// Inlined (not via the login helper) since this flow never reaches /dashboard.
test("invalid credentials are rejected", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByTestId("login-error")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

// Edge case: uploading a non-CSV file surfaces a validation error.
test("uploading a non-CSV file shows a validation error", async ({ page }) => {
  await login(page);
  await page.goto("/upload");
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("just some text") });
  await expect(page.getByTestId("upload-error")).toBeVisible();
  await expect(page.getByTestId("upload-error")).toContainText(/csv/i);
});
