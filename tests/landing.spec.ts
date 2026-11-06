import { expect, test } from "@playwright/test";

test("landing shows the Moby concept and supports keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Moby/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A little robot for your desk.");
  await expect(page.locator("figure").first()).toContainText("Moby Mini");
  await expect(page.getByRole("list", { name: "Parts of Moby Mini" })).toBeAttached();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link")).toHaveText(["How it works", "Privacy", "Demo", "Download", "Docs"]);

  const footer = page.getByRole("contentinfo");
  await footer.getByRole("link", { name: "Terms of Service" }).click();
  await expect(page).toHaveURL(/\/legal\/terms\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of Service");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Source on GitHub" })).toHaveAttribute("href", "https://github.com/mobyuz/moby-web");
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Docs" })).toBeVisible();
});

test("narrow screens fit the page and reduced motion shows the poster and the parts as text", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("img.poster")).toBeVisible();
  const parts = page.getByRole("list", { name: "Parts of Moby Mini" });
  await expect(parts).toContainText("Microphone");
  await expect(parts).toContainText("Speaker");
  await expect(parts).toContainText("Board");
  await expect(parts.locator(".part").first()).toHaveCSS("opacity", "1");
  const pageFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(pageFits).toBe(true);
});

test("mobile menu opens with aria-expanded, traps focus, and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Open menu" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Privacy" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
});
