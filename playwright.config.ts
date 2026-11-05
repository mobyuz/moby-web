import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";
const upstreamPort = 4180;

export default defineConfig({
  testDir: "./tests",
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  webServer: [
    {
      command: `node tests/fixtures/demo-api.mjs ${upstreamPort}`,
      port: upstreamPort,
    },
    {
      command: "npm run dev -- --port 4173 --strictPort",
      url: baseURL,
      env: {
        MOBY_API_ORIGIN: `http://127.0.0.1:${upstreamPort}`,
        VITE_MOBY_TURNSTILE_SITE_KEY: "playwright-test-site-key",
      },
    },
  ],
});
