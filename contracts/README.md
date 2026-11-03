# Moby API kontrakti

`moby-api.openapi.json` — `moby-api`dagi `openapi.json`ning Wb0 uchun qadalgan nusxasi.
Manba commit `2de25f19aa2fcf91ee95fabea8e187a7f78c4fa3`, API versiyasi `0.1.0`.
Manba kontrakti GPL-3.0-only ostida tarqatiladi. [OpenAPI manbasi](https://github.com/mobyuz/moby-api/blob/2de25f19aa2fcf91ee95fabea8e187a7f78c4fa3/openapi.json)
Checkoutda versiyalangan API reliz artefakti topilmagani uchun shu commit tanlandi.

Keyingi yangilashda tasdiqlangan API relizidagi `openapi.json` faylini shu yerga
joylang, reliz manbasini ushbu faylda qayd eting va `npm run api:generate`ni bajaring.
OpenAPI nusxasi va `src/api/schema.d.ts` bitta PR’da yangilanadi. `npm run api:check`
generatsiya qilingan tiplar qadalgan kontraktga mosligini tekshiradi.

Bu nusxada `POST /v1/demo/chat` yo‘li yo‘q. Wb2 uchun kontrakt B6 relizidan yangilanadi.
