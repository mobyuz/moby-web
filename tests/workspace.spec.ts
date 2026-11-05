import { createHash } from "node:crypto";
import { expect, test, type BrowserContext } from "@playwright/test";

const installationId = "c4cdbd2e-c1f5-4a97-92af-1a11b390aeda";
const profile = { id: "account-id", email: "browser@example.test", installation_id: installationId };
const pair = {
  access_token: "access-test-token",
  refresh_token: "refresh-test-token",
  token_type: "Bearer",
  expires_in: 900,
  installation_id: installationId,
};

async function mockAccount(context: BrowserContext) {
  await context.route("**/v1/me", (route) => route.fulfill({ json: profile }));
  await context.route("**/v1/installations", (route) => route.fulfill({ json: [] }));
  await context.route("**/v1/consents", (route) => route.fulfill({
    json: {
      current_versions: { terms: "dev-1", privacy_policy: "dev-1", cloud_voice: "dev-1" },
      records: [],
    },
  }));
}

test("rotates the session once for concurrent reads and streams the assistant reply", async ({ page, context }) => {
  await mockAccount(context);
  let refreshCalls = 0;
  await context.route("**/v1/auth/login", (route) => route.fulfill({ json: { ...pair, expires_in: 1 } }));
  await context.route("**/v1/auth/refresh", (route) => {
    refreshCalls += 1;
    expect(route.request().postDataJSON()).toEqual({ refresh_token: pair.refresh_token });
    return route.fulfill({ json: { ...pair, access_token: "fresh-access", refresh_token: "fresh-refresh" } });
  });
  await context.route("**/v1/agent/turn", (route) => {
    expect(route.request().headers().authorization).toBe("Bearer fresh-access");
    expect(route.request().postDataJSON()).toEqual({
      messages: [{ kind: "user", text: "Hello" }],
      available_tools: [],
      resources: [],
      language: "en",
      script: "latn",
    });
    return route.fulfill({
      contentType: "text/event-stream",
      body: [
        ": keep-alive",
        "",
        'data: {"event":"speech_delta","text":"Hello"}',
        "",
        'data: {"event":"completed","speech_text":"Hello from the assistant","expression_hint":"happy"}',
        "",
        "",
      ].join("\r\n"),
    });
  });
  await context.route("**/v1/auth/logout", (route) => {
    expect(route.request().postDataJSON()).toEqual({ refresh_token: "fresh-refresh" });
    return route.fulfill({ status: 204 });
  });

  await page.goto("/app/");
  await page.getByLabel("Email address", { exact: true }).fill(profile.email);
  await page.getByLabel("Password", { exact: true }).fill("Synthetic browser test password");
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(profile.email)).toBeVisible();
  expect(refreshCalls).toBe(1);
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await page.getByRole("textbox", { name: "Message" }).fill("Hello");
  await page.getByRole("button", { name: "Send to assistant" }).click();
  await expect(page.getByText("Hello from the assistant")).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in to Moby" })).toBeVisible();
});

for (const hostname of ["127.0.0.1", "localhost"]) {
  test(`exchanges a Google code from ${hostname} through the backend loopback handoff`, async ({ page, context, baseURL }) => {
    await mockAccount(context);
    let challenge = "";
    const code = "a".repeat(64);
    await context.route(/\/v1\/auth\/google\/start\?/, (route) => {
      const url = new URL(route.request().url());
      const state = url.searchParams.get("desktop_state");
      challenge = url.searchParams.get("code_challenge") ?? "";
      expect(url.searchParams.get("desktop_port")).toBe(url.port);
      expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(url.hostname).toBe("127.0.0.1");
      return route.fulfill({ status: 303, headers: { Location: `${url.origin}/oauth/moby?state=${state}&code=${code}` } });
    });
    await context.route("**/v1/auth/google/exchange", (route) => {
      const proof = route.request().postDataJSON();
      expect(proof.code).toBe(code);
      expect(createHash("sha256").update(proof.code_verifier).digest("base64url")).toBe(challenge);
      return route.fulfill({ json: pair });
    });

    const entry = new URL("/app/", baseURL);
    entry.hostname = hostname;
    await page.goto(entry.href);
    const google = page.getByRole("link", { name: "Continue with Google", exact: true });
    await expect(google).toBeVisible();
    await google.click();
    await expect(page).toHaveURL(`${baseURL}/app/?view=google`);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await expect(page.getByText(profile.email)).toBeVisible();
  });
}

test("Google is available from registration and an unavailable provider returns a recoverable error", async ({ page, context }) => {
  let exchangeCalls = 0;
  await context.route(/\/v1\/auth\/google\/start\?/, (route) => route.fulfill({
    status: 503,
    json: { code: "unavailable" },
  }));
  await context.route("**/v1/auth/google/exchange", (route) => {
    exchangeCalls += 1;
    return route.abort();
  });
  await page.goto("/app/?view=register");
  await page.getByRole("link", { name: "Continue with Google", exact: true }).click();
  await page.getByRole("checkbox").check();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  const popup = await popupPromise;
  await expect(page.getByRole("alert")).toContainText("Google sign-in is unavailable right now.");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await expect.poll(() => popup.isClosed()).toBe(true);
  expect(exchangeCalls).toBe(0);
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
});

test("sign-in offers password visibility, a recovery screen, and the shared footer on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/app/");
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("Synthetic browser test password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "API status" })).toHaveAttribute("href", "/app/#api-status");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Choose a new password" })).toBeVisible();
});
