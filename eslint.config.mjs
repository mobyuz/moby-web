import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/", ".npm-cache/", "playwright-report/", "test-results/", "src/api/schema.d.ts"] },
  js.configs.recommended,
  tseslint.configs.recommended,
);
