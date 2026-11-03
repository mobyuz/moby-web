# 0001 · Static website foundation

November 3, 2026 · Wb0

The Moby v1.0 technical plan specifies React, TypeScript, Vite, and Tailwind.
Vite produces a static build in `dist/`. The Rust and Axum backend owns
accounts and usage. Server-side rendering would add a web server and a
separate deployment for the landing page. Tailwind styles the page, and
CSS animates Moby’s face.

TypeScript declarations come from a pinned OpenAPI snapshot so the build
works independently of a running API server. Wb0 pins the contract to an
upstream commit. The guest demo client will use the B6 release contract.

Wb0 uses a local `MobyFace` component. Wb1 will integrate a versioned
`@mobyuz/moby-ui` release when it is available.

## References

- [Vite](https://vite.dev/guide/)
- [React](https://react.dev/reference/react-dom/client/createRoot)
- [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite)
- [OpenAPI TypeScript](https://openapi-ts.dev/cli)
