# ADR 0002: The Windows app is downloaded from this site

Status: accepted. The release pipeline itself is desktop stage D6 and is not built here.

## Decision

Visitors download the Windows installer from `/downloads/windows/` on this site, not from GitHub. The site owns a small manifest, `public/downloads/windows/latest.json`. The Download section and the footer read it. While the manifest does not exist, which is the state today, the page shows "coming soon" and offers the guest demo. No fake manifest is shipped.

## How a release gets onto the site

1. Build the installer in `moby-desktop` (`npm run tauri -- build --bundles nsis`). The CI job already uploads an unsigned NSIS `.exe` as an artifact. Signed updates (stage D6) do not exist yet.
2. Put these two files under `public/downloads/windows/`:
   - the installer, for example `Moby-Setup-0.1.0-x64.exe`
   - `latest.json`
3. Compute the size and hash of the exact file you ship:

   ```powershell
   (Get-Item .\Moby-Setup-0.1.0-x64.exe).Length
   (Get-FileHash .\Moby-Setup-0.1.0-x64.exe -Algorithm SHA256).Hash.ToLower()
   ```

4. Write the manifest:

   ```json
   {
     "version": "0.1.0",
     "file": "Moby-Setup-0.1.0-x64.exe",
     "size": 48234496,
     "sha256": "64 hexadecimal digits",
     "released": "2026-12-01",
     "notes": "/docs/",
     "signed": false
   }
   ```

   | Field | Rule |
   | --- | --- |
   | `version` | `major.minor.patch`, optionally with a `-prerelease` suffix |
   | `file` | File name only, ending in `.exe`, sitting next to `latest.json` |
   | `size` | Size in bytes, a positive integer |
   | `sha256` | Exactly 64 hexadecimal digits |
   | `released` | `YYYY-MM-DD`, a real date |
   | `notes` | Optional. A site path starting with `/` or an `https://` URL |
   | `signed` | Optional boolean. When it is not `true` the page shows the Windows SmartScreen note |

5. Run `npm run release:check`. `npm run build` runs it too and fails if the manifest is invalid, the installer is missing, or the size or SHA-256 do not match the file.

## Behaviour on the page

- No manifest, a bad manifest, or an installer that does not answer a `HEAD` request: "coming soon", never a broken link.
- A valid manifest: version, size, date, "Windows 10 and 11, 64-bit", the SHA-256 with a copy button and a PowerShell check, and the SmartScreen note while `signed` is not `true`.

## Hosting

- Serve `.exe` as `application/octet-stream` or `application/vnd.microsoft.portable-executable`, and `latest.json` as `application/json`. The page treats an HTML response as "no file".
- Serve `latest.json` without long caching (`Cache-Control: no-cache`), so a new release shows up at once.
- The Content Security Policy stays `self` only. The page only fetches same-origin files, and the one external script is Cloudflare Turnstile for the guest demo.
- Do not commit installers to git history. Add the binary at deploy time, or use Git LFS, and keep `latest.json` in step with it.
