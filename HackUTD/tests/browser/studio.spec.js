import { test, expect } from "@playwright/test";
test("private local workflow calculates, compares, exports and pauses invalid scenarios", async ({
  page,
}) => {
  const external = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:4199")) external.push(r.url());
  });
  await page.goto("/");
  await expect(page.getByTestId("monthly")).toContainText("$2,270");
  await page
    .getByRole("button", { name: "Save for comparison", exact: true })
    .click();
  await page.locator("#rate").fill("5");
  await page
    .getByRole("button", { name: "Save for comparison", exact: true })
    .click();
  await expect(page.locator(".comparison")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Load scenario 1", exact: true })
    .click();
  await expect(page.locator("#rate")).toHaveValue("6.5");
  await page.locator("#income").fill("");
  await expect(
    page.getByRole("heading", { name: "Estimate paused." }),
  ).toBeVisible();
  await expect(page.getByTestId("monthly")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Export scenario", exact: true }),
  ).toBeDisabled();
  await page.locator("#income").fill("8000");
  await page.locator("#extra").fill("500");
  await expect(page.getByTestId("monthly")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export monthly schedule" }).click();
  expect((await download).suggestedFilename()).toBe(
    "homeready-amortization.csv",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{bad"),
    });
  await expect(page.getByRole("alert")).toContainText("valid scenario");
  await expect(page.locator("#extra")).toHaveValue("500");
  expect(external).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.screenshot({
    path: "test-results/studio-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator(".comparison")).toHaveCount(0);
  await expect(page.locator("#extra")).toHaveValue("0");
});
test("mobile layout, labels, keyboard input and valid import work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 850 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#rate").fill("0");
  await expect(page.getByTestId("monthly")).toContainText("$1,278");
  await page.locator("#price").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#down")).toBeFocused();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export scenario", exact: true })
    .click();
  const file = await download;
  await page.locator("#rate").fill("5");
  await page.locator("input[type=file]").setInputFiles(await file.path());
  await expect(page.locator("#rate")).toHaveValue("0");
  await page.screenshot({
    path: "test-results/studio-mobile.png",
    fullPage: true,
  });
});
