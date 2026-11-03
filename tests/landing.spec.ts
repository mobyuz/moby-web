import { expect, test } from "@playwright/test";

test("landing shows the Moby concept and supports keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Moby/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Stol ustidagi yordamchi robot.");
  await expect(page.locator("figure")).toContainText("MOBY / CORE V1");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Asosiy mazmunga o‘tish" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  await page.getByRole("navigation").getByRole("link", { name: "Savollar" }).click();
  await expect(page).toHaveURL(/#savollar$/);
  await page.getByText("Qaysi kompyuterlar uchun?", { exact: true }).click();
  await expect(page.getByText(/64 bitli Windows 10 va 11/)).toBeVisible();
});

test("narrow screens fit the page and reduced motion pauses the face", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".robot-eyes")).toHaveCSS("animation-name", "none");
  const pageFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(pageFits).toBe(true);
});
