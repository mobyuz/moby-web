import type { Model } from "../api/workspace";

export const locales = {
  en: { label: "English", language: "en", script: "latn" },
  ru: { label: "Russian", language: "ru", script: "cyrl" },
  "uz-latn": { label: "Uzbek (Latin)", language: "uz", script: "latn" },
  "uz-cyrl": { label: "Uzbek (Cyrillic)", language: "uz", script: "cyrl" },
} as const satisfies Record<string, { label: string; language: Model<"Language">; script: Model<"Script"> }>;

export type LocaleKey = keyof typeof locales;
export type Locale = Pick<typeof locales[LocaleKey], "language" | "script">;
