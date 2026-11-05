import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", (route) => route.fulfill({
    contentType: "application/javascript",
    body: `
      window.turnstile = {
        ready(callback) { callback(); },
        render(_container, options) {
          if (options.action !== "demo_chat" || options.sitekey !== "playwright-test-site-key") {
            throw new Error("Unexpected widget configuration");
          }
          options.callback("test-" + crypto.randomUUID());
          return "test-widget";
        },
        remove() {},
      };
    `,
  }));
});

test("sends verified text to the API and displays its reply", async ({ page }) => {
  await page.goto("/#demo");
  const message = page.getByRole("textbox", { name: "Message" });
  const send = page.getByRole("button", { name: "Send message" });
  await message.fill("🙂".repeat(281));
  await expect(send).toBeDisabled();
  await expect(page.getByText(/281 \/ 280 characters/)).toBeVisible();

  const text = "🙂".repeat(280);
  await message.fill(text);
  await expect(send).toBeEnabled();
  const requestPromise = page.waitForRequest((request) => new URL(request.url()).pathname === "/v1/demo/chat");
  await send.click();
  const request = await requestPromise;
  expect(request.method()).toBe("POST");
  expect(request.postDataJSON()).toEqual({ text, bot_token: expect.stringMatching(/^test-/) });
  expect((await request.allHeaders()).authorization).toBeUndefined();
  await expect(page.getByText("Hello from the Moby API test server.")).toBeVisible();
  await expect(page.locator(".demo-response")).toHaveAttribute("data-state", "success");
});

test("shows the API rate limit and obtains a fresh token before a retry", async ({ page }) => {
  await page.goto("/#demo");
  const message = page.getByRole("textbox", { name: "Message" });
  const send = page.getByRole("button", { name: "Send message" });
  await message.fill("Trigger the limit");
  await send.click();
  await expect(page.getByText(/This network has reached the demo limit/)).toBeVisible();
  await expect(message).toHaveValue("Trigger the limit");
  await expect(page.locator(".demo-response")).toHaveAttribute("data-state", "error");

  await message.fill("Try again");
  await send.click();
  await expect(page.getByText("Hello from the Moby API test server.")).toBeVisible();
});
