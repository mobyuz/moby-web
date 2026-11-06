import { expect, test, type Page } from "@playwright/test";

// A software GL stack makes WebGL available in headless Chromium.
test.setTimeout(180_000);
test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] } });

const story = (page: Page) => page.locator("section.story");

async function expectLive(page: Page) {
  await expect(story(page)).toHaveAttribute("data-scene", "live", { timeout: 45_000 });
}

/** The model is on screen when the scene reports that it draws frames and every part is inside the camera view. */
async function expectModelShown(page: Page) {
  const frames = async () => Number(await story(page).getAttribute("data-frames"));
  const before = await frames();
  await expect.poll(frames, { timeout: 25_000 }).toBeGreaterThan(before);
  await expect(story(page)).toHaveAttribute("data-scene", "live");
  const parts = Number(await story(page).getAttribute("data-parts"));
  await expect.poll(async () => Number(await story(page).getAttribute("data-parts-in-view")), { timeout: 45_000 }).toBe(parts);
  await expect.poll(() => page.locator(".poster").evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(0.02);
  await expect.poll(() => page.locator(".story-view").evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.98);
}

/** Pixels: the stage region differs from the same region with the 3D layer hidden, so the canvas really drew something. */
async function expectCanvasDrawn(page: Page) {
  const box = await page.locator(".story-model").boundingBox();
  if (!box) throw new Error("no hero frame");
  const clip = { x: box.x + box.width * 0.2, y: box.y + box.height * 0.2, width: box.width * 0.6, height: box.height * 0.6 };
  const withModel = await page.screenshot({ clip });
  await page.addStyleTag({ content: ".story-view{visibility:hidden !important}" });
  const without = await page.screenshot({ clip });
  await page.evaluate(() => document.querySelectorAll("style").forEach((el) => { if (el.textContent?.includes("visibility:hidden !important")) el.remove(); }));
  expect(Math.abs(withModel.length - without.length)).toBeGreaterThan(without.length * 0.05);
}

/** Scrolls inside the page in one call, so a slow software-GL frame costs one round trip, not one per step. */
async function scrollStep(page: Page, to: number, steps: number, delay: number) {
  await page.evaluate(
    async ({ to, steps, delay }) => {
      const from = window.scrollY;
      for (let i = 1; i <= steps; i += 1) {
        // Instant, so the site's smooth scrolling doesn't stretch each step under a slow frame.
        window.scrollTo({ top: from + ((to - from) * i) / steps, behavior: "instant" });
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      }
    },
    { to, steps, delay },
  );
}

test("the hero model is still there after scrolling down and back up, slowly and fast, several times", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/");
  await expectLive(page);
  await expectModelShown(page);
  await expectCanvasDrawn(page);

  const bottom = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (const [steps, delay] of [[1, 0], [4, 0], [1, 0], [8, 20]] as const) {
    await scrollStep(page, bottom, steps, delay);
    await page.waitForTimeout(800);
    await scrollStep(page, 0, steps, delay);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expectModelShown(page);
  }
  await expectCanvasDrawn(page);
});

test("the hero model survives leaving the hero and coming back on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expectLive(page);
  const bottom = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await scrollStep(page, bottom, 20, 20);
  await scrollStep(page, 0, 20, 20);
  // The closing animation is damped, so wait for it to settle before checking the framing.
  await expect.poll(async () => Number(await story(page).getAttribute("data-progress")), { timeout: 60_000 }).toBeLessThan(0.01);
  await expectModelShown(page);
});

test("losing the WebGL context shows the poster, and restoring it brings the model back", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expectLive(page);
  await page.evaluate(() => {
    const gl = document.querySelector("canvas")?.getContext("webgl2") ?? document.querySelector("canvas")?.getContext("webgl");
    const lose = gl?.getExtension("WEBGL_lose_context");
    if (!lose) throw new Error("WEBGL_lose_context is not available");
    (window as unknown as { __lose: typeof lose }).__lose = lose;
    lose.loseContext();
  });
  await expect(story(page)).toHaveAttribute("data-scene", "lost");
  await expect.poll(() => page.locator(".poster").evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.98);
  await page.evaluate(() => (window as unknown as { __lose: { restoreContext: () => void } }).__lose.restoreContext());
  await expect(story(page)).toHaveAttribute("data-scene", "live", { timeout: 20_000 });
});

test("scrolling during start-up never stops the model from loading", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/", { waitUntil: "commit" });
  // Scroll about 30% of the page almost at once, then back to the top, while the scene is still starting.
  for (const fraction of [0.1, 0.2, 0.3, 0.15, 0]) {
    await page.evaluate((f) => window.scrollTo(0, f * (document.documentElement.scrollHeight - window.innerHeight)), fraction).catch(() => undefined);
    await page.waitForTimeout(120);
  }
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBe(0);
  await expect(story(page)).toHaveAttribute("data-scene", "live", { timeout: 60_000 });
  // The closing animation is damped, so wait for it to settle before checking the framing.
  await expect.poll(async () => Number(await story(page).getAttribute("data-progress")), { timeout: 60_000 }).toBeLessThan(0.01);
  await expectModelShown(page);
});

test("a model that cannot load is retried once, then the poster stays and the page is not stuck loading", async ({ page }) => {
  let requests = 0;
  await page.route("**/models/moby-mini.glb", (route) => { requests += 1; void route.abort(); });
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/");
  await expect.poll(() => requests, { timeout: 60_000 }).toBeGreaterThanOrEqual(2);
  await expect(story(page)).toHaveAttribute("data-scene", "poster", { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await expect(story(page)).toHaveAttribute("data-scene", "poster");
  expect(await page.locator("canvas").count()).toBe(0);
  await expect.poll(() => page.locator(".poster").evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
});
