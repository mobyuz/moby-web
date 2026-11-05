import { expect, test } from "@playwright/test";

test("landing shows the Moby concept and supports keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Moby/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your desktop companion robot.");
  await expect(page.locator("figure")).toContainText("Moby Mini");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Terms" }).click();
  await expect(page).toHaveURL(/\/legal\/terms\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of Service");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Source on GitHub" })).toHaveAttribute("href", "https://github.com/mobyuz/moby-web");
});

test("narrow screens fit the page and reduced motion pauses the face", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".demo-response .robot-eyes")).toHaveCSS("animation-name", "none");
  const pageFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(pageFits).toBe(true);
});
