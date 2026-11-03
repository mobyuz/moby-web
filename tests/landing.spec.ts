import { expect, test } from "@playwright/test";

test("landing shows the Moby concept and supports keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Moby/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your desktop companion robot.");
  await expect(page.locator("figure")).toContainText("MOBY / CORE V1");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  await page.getByRole("navigation").getByRole("link", { name: "FAQ" }).click();
  await expect(page).toHaveURL(/#faq$/);
  await page.getByText("Which computers will Moby support?", { exact: true }).click();
  await expect(page.getByText(/64-bit Windows 10 and 11/)).toBeVisible();
});

test("narrow screens fit the page and reduced motion pauses the face", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".robot-eyes")).toHaveCSS("animation-name", "none");
  const pageFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(pageFits).toBe(true);
});
