# Moby Web

Moby robotining statik tanishtiruv sayti. Bu checkout Wb0 bosqichi uchun tayyorlangan.

## Windowsda ishga tushirish

`.node-version`dagi Node.js 24.13.0 va npm 11.6.2 bilan PowerShell’da bajaring.

```powershell
git clone https://github.com/mobyuz/moby-web.git
Set-Location moby-web
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd run dev
```

Vite terminalda lokal manzilni chiqaradi. Production yig‘ilmasi `dist/`ga chiqadi.

```powershell
npm.cmd run build
npm.cmd run preview
```

## Stek

| Qatlam | Texnologiya |
| --- | --- |
| UI | React, qat’iy TypeScript, Tailwind CSS |
| Yig‘ish | Vite, npm lockfile, statik HTML/CSS/JS |
| API kontrakti | `moby-api` OpenAPI 3.1 nusxasi, `openapi-typescript` deklaratsiyalari |
| Tekshiruv | ESLint, TypeScript, Playwright, GitHub Actions |

Wb0 landing API va Docker’siz ochiladi. Kontraktning kelib chiqishi
[contracts/README.md](contracts/README.md)da. `.env.example` keyingi integratsiya
uchun lokal API manzilini ko‘rsatadi. `VITE_` qiymatlari brauzerga ochiq.

## Tekshiruv

```powershell
npm.cmd run api:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npx.cmd --no-install playwright install chromium
npm.cmd test
```

Playwright yig‘ilgan saytni lokal Vite preview orqali tekshiradi. Kompyuterda
Chrome o‘rnatilgan bo‘lsa, Chromium’ni yuklash o‘rniga joriy terminalda
`$env:PLAYWRIGHT_CHANNEL = 'chrome'` deb belgilang va `npm.cmd test`ni bajaring.

## Keyingi bosqichlar

- **Wb1** · O‘zbek lotin, rus va ingliz tillari hamda versiyalangan `moby-ui` komponenti.
- **Wb2** · B6 OpenAPI kontraktidan olingan mehmon matnli demo klienti. Bot tekshiruvi, IP kvotasi va alohida byudjet API tomonida.
- **Wb3** · Windows o‘rnatuvchisi, SHA-256 xeshi va ko‘rikdan o‘tgan huquqiy sahifalar.
- **Wb4** · CSP, CORS, qulaylik va ishlash tezligini tekshirish. Hosting bo‘yicha qaror asosiy rejada ochiq.

[Wb0 qaror yozuvi](docs/adr/0001-web-foundation.md)

## Litsenziya

GNU General Public License v3.0 only. [LICENSE](LICENSE)
