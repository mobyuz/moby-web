import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const { MOBY_API_ORIGIN } = loadEnv(mode, process.cwd(), "MOBY_API_");

  return {
    plugins: [react(), tailwindcss()],
    // @mobyuz/moby-ui is a sibling checkout linked with file:, so it has its own node_modules. Share one React.
    resolve: { dedupe: ["react", "react-dom", "three"] },
    build: {
      rolldownOptions: {
        input: [
          resolve(import.meta.dirname, "index.html"),
          resolve(import.meta.dirname, "app/index.html"),
          resolve(import.meta.dirname, "oauth/moby.html"),
          ...["legal/privacy", "legal/terms", "docs", "docs/web-app", "docs/api", "docs/security", "docs/data"]
            .map((page) => resolve(import.meta.dirname, page, "index.html")),
        ],
      },
    },
    server: {
      fs: { allow: [".", "../moby-ui"] },
      proxy: {
        "^/(?:v1/|(?:health|ready|openapi\\.json)(?:\\?|$))": {
          target: MOBY_API_ORIGIN || "http://127.0.0.1:8080",
          changeOrigin: true,
        },
      },
    },
  };
});
