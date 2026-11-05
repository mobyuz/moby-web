# 0001 · Static website foundation

November 3, 2026 · Wb0

The Moby v1.0 technical plan specifies React, TypeScript, Vite, and Tailwind.
Vite produces a static build in `dist/`. The Rust and Axum backend owns
accounts and usage. Server-side rendering would add a web server and a
separate deployment for the landing page. Tailwind styles the page, and
CSS animates Moby’s face.

TypeScript declarations come from a pinned OpenAPI snapshot so the build
works independently of a running API server.

Wb0 uses a local `MobyFace` component. Wb1 will integrate a versioned
`@mobyuz/moby-ui` release when it is available.

## Wb2 guest demo

The guest demo uses the merged B6 contract and a same-origin request.
Direct browser requests to a separate API origin would require CORS support
in the backend. Vite proxies the demo path locally, and the production
host routes the same path to the API. The widget loads when a visitor
focuses the demo input. Its token is replaced after each request.

## Signed-in web app

The signed-in app has a separate entry page so it can run without the
guest widget. It stores the session in tab memory and coordinates concurrent
refreshes because the API rotates each refresh token after one use.
It uses the same-origin proxy for the public API routes.

Google uses the API’s loopback callback and a PKCE verifier held by the
initiating tab. The callback returns the one-time code on a channel keyed
by the OAuth state. The browser sends an empty desktop tool catalog when
it opens an assistant stream.

## References

- [Vite](https://vite.dev/guide/)
- [React](https://react.dev/reference/react-dom/client/createRoot)
- [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite)
- [OpenAPI TypeScript](https://openapi-ts.dev/cli)
