import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { parseRelease } from "../src/landing/release";

const fixture = JSON.parse(readFileSync(resolve(import.meta.dirname, "fixtures/release/latest.json"), "utf8")) as Record<string, unknown>;

test.describe("release manifest validation", () => {
  test("accepts a complete manifest and normalises the hash", () => {
    const release = parseRelease({ ...fixture, sha256: String(fixture.sha256).toUpperCase() });
    expect(release?.version).toBe("0.1.0");
    expect(release?.sha256).toBe(fixture.sha256);
    expect(release?.signed).toBe(false);
  });

  for (const [name, patch] of Object.entries({
    "a version that is not x.y.z": { version: "latest" },
    "a hash with the wrong length": { sha256: "abc123" },
    "a hash with non-hex characters": { sha256: "z".repeat(64) },
    "a file that is not an .exe": { file: "Moby-Setup.msi" },
    "a file with a path": { file: "../Moby-Setup.exe" },
    "a size that is not positive": { size: 0 },
    "a date that is not a date": { released: "2026-13-45" },
    "notes on another scheme": { notes: "javascript:alert(1)" },
  })) {
    test(`rejects ${name}`, () => {
      expect(parseRelease({ ...fixture, ...patch })).toBeNull();
    });
  }

  test("rejects a missing field and non-objects", () => {
    const rest = { ...fixture };
    delete rest.sha256;
    expect(parseRelease(rest)).toBeNull();
    expect(parseRelease(null)).toBeNull();
    expect(parseRelease([])).toBeNull();
    expect(parseRelease("x")).toBeNull();
  });

  test("the build check passes with no manifest and fails when the installer is missing", () => {
    const script = resolve(import.meta.dirname, "../scripts/check-release.mjs");
    expect(() => execFileSync("node", [script, resolve(import.meta.dirname, "fixtures/none")], { stdio: "pipe" })).not.toThrow();
    expect(() => execFileSync("node", [script, resolve(import.meta.dirname, "fixtures/release")], { stdio: "pipe" })).toThrow();
  });
});

test("with no manifest the download section says coming soon and offers the demo", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#download");
  await expect(section.getByRole("heading", { level: 2 })).toHaveText("Moby for Windows is coming soon.");
  await expect(section.getByRole("button", { name: /Download for Windows/ })).toBeDisabled();
  await expect(section.getByRole("link", { name: "Try the guest demo" })).toHaveAttribute("href", "#demo");
  await expect(section.locator("a[href$='.exe']")).toHaveCount(0);
});

test("a bad manifest fails safely to coming soon", async ({ page }) => {
  await page.route("**/downloads/windows/latest.json", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...fixture, sha256: "nope" }) }));
  await page.goto("/");
  await expect(page.locator("#download").getByRole("heading", { level: 2 })).toHaveText("Moby for Windows is coming soon.");
});

test("a manifest whose installer is missing fails safely to coming soon", async ({ page }) => {
  await page.route("**/downloads/windows/latest.json", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(fixture) }));
  await page.route("**/downloads/windows/Moby-Setup-0.1.0-x64.exe", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/");
  await expect(page.locator("#download").getByRole("heading", { level: 2 })).toHaveText("Moby for Windows is coming soon.");
});

test("a valid manifest shows the version, size, date, hash and SmartScreen note", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/downloads/windows/latest.json", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(fixture) }));
  await page.route("**/downloads/windows/Moby-Setup-0.1.0-x64.exe", (route) => route.fulfill({ contentType: "application/vnd.microsoft.portable-executable", body: "MZ" }));
  await page.goto("/");
  const section = page.locator("#download");
  await expect(section.getByRole("heading", { level: 2 })).toHaveText("Moby for Windows.");
  const download = section.getByRole("link", { name: "Download for Windows" });
  await expect(download).toHaveAttribute("href", "/downloads/windows/Moby-Setup-0.1.0-x64.exe");
  await expect(section).toContainText("0.1.0");
  await expect(section).toContainText("46.0 MB");
  await expect(section).toContainText("1 December 2026");
  await expect(section).toContainText("Windows 10 and 11, 64-bit");
  await expect(section).toContainText(String(fixture.sha256));
  await expect(section).toContainText("SmartScreen");
  await section.getByRole("button", { name: "Copy" }).click();
  await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(fixture.sha256);
});
