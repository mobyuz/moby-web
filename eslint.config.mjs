import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/", "dist-e2e/", ".npm-cache/", "playwright-report/", "test-results/", "src/api/schema.d.ts", "public/draco/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: { console: "readonly", process: "readonly" } } },
);
