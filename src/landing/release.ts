/** The Windows release manifest the site owns: public/downloads/windows/latest.json. */
export type Release = {
  version: string;
  file: string;
  size: number;
  sha256: string;
  released: string;
  notes?: string;
  signed: boolean;
};

export const MANIFEST_URL = "/downloads/windows/latest.json";
export const DOWNLOAD_DIR = "/downloads/windows/";

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.exe$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns the release when every field is valid, otherwise null, so a bad manifest never produces a download. */
export function parseRelease(value: unknown): Release | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const m = value as Record<string, unknown>;
  const { version, file, size, sha256, released, notes, signed } = m;
  if (typeof version !== "string" || !VERSION.test(version)) return null;
  if (typeof file !== "string" || !FILE.test(file)) return null;
  if (typeof size !== "number" || !Number.isSafeInteger(size) || size <= 0) return null;
  if (typeof sha256 !== "string" || !SHA256.test(sha256)) return null;
  if (typeof released !== "string" || !DATE.test(released) || Number.isNaN(Date.parse(`${released}T00:00:00Z`))) return null;
  if (notes !== undefined && (typeof notes !== "string" || !/^(\/(?!\/)|https:\/\/)/.test(notes))) return null;
  if (signed !== undefined && typeof signed !== "boolean") return null;
  return { version, file, size, sha256: sha256.toLowerCase(), released, ...(notes ? { notes } : {}), signed: signed === true };
}

export function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
