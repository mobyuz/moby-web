// Validates the Windows release manifest before a build.
//   no manifest: fine, the site shows "coming soon"
//   manifest present: it must be valid, the installer must sit next to it, and size and SHA-256 must match
// Usage: node scripts/check-release.mjs [directory containing latest.json]
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { parseRelease } from "../src/landing/release.ts";

const dir = resolve(process.argv[2] ?? "public/downloads/windows");
const manifestPath = resolve(dir, "latest.json");

if (!existsSync(manifestPath)) {
  console.log("release: no latest.json, the download section will show 'coming soon'");
  process.exit(0);
}

const fail = (message) => {
  console.error(`release: ${message}`);
  process.exit(1);
};

let raw;
try {
  raw = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch {
  fail("latest.json is not valid JSON");
}
const release = parseRelease(raw);
if (!release) fail("latest.json is invalid: check version (1.2.3), file (*.exe), size (bytes), sha256 (64 hex digits) and released (YYYY-MM-DD)");

const installer = resolve(dir, release.file);
if (!existsSync(installer)) fail(`${release.file} is listed in latest.json but is not in ${dir}`);
if (statSync(installer).size !== release.size) fail(`size in latest.json (${release.size}) does not match ${release.file} (${statSync(installer).size})`);
const hash = createHash("sha256").update(readFileSync(installer)).digest("hex");
if (hash !== release.sha256) fail(`sha256 in latest.json does not match ${release.file} (${hash})`);

console.log(`release: ${release.version} ${release.file} verified`);
