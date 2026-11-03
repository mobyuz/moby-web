# 0001 · Statik veb karkasi

2026-yil 3-noyabr · Wb0

V1.0 texnik reja veb uchun React, TypeScript, Vite va Tailwind’ni belgilaydi.
Vite statik `dist/` yig‘adi. Rust/Axum backend ma’lumot va hisoblarni boshqaradi.
Server renderingi yoki alohida veb server ilovasi bu bosqich uchun qo‘shimcha
ishga tushirish va deploy talab qilardi. Dizayn Tailwind orqali, Moby yuzining
harakati esa kichik CSS animatsiyasi orqali berildi.

API klienti uchun OpenAPI’dan tip generatsiyasi tanlandi. Jonli serverdan olish
buildni tarmoq va ayni paytda ishlayotgan API versiyasiga bog‘lab qo‘yardi.
Mahalliy checkoutda reliz artefakti topilmagani sabab Wb0 uchun commitga qadalgan
nusxa ishlatildi. Demo tarmoq klienti B6 kontrakti tasdiqlangach qo‘shiladi.

`moby-ui` checkouti mavjud emas. Wb0 lokal `MobyFace` komponentidan foydalanadi.
Wb1 da tasdiqlangan `@mobyuz/moby-ui` reliziga ulanish rejalashtirilgan.

Qaror Moby dasturiy tizimining v1.0 texnik rejasiga asoslanadi.

Texnik manbalar
[Vite](https://vite.dev/guide/), [React](https://react.dev/reference/react-dom/client/createRoot),
[Tailwind](https://tailwindcss.com/docs/installation/using-vite) va
[OpenAPI TypeScript](https://openapi-ts.dev/cli).
