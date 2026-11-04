import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { handleGuide } from "./functions/ai-guide.mjs";
import { handleFitAnalysis } from "./functions/check-nicos-fit.mjs";

function localNetlifyFunctions() {
  const handlers = new Map([
    ["/.netlify/functions/ai-guide", handleGuide],
    ["/.netlify/functions/check-nicos-fit", handleFitAnalysis],
  ]);

  return {
    name: "local-netlify-functions",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || "/", "http://localhost").pathname;
        const handler = handlers.get(pathname);
        if (!handler) {
          next();
          return;
        }

        try {
          const headers = new Headers();
          for (const [name, value] of Object.entries(request.headers)) {
            if (value) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
          }
          const method = request.method || "GET";
          const hasBody = method !== "GET" && method !== "HEAD";
          const webRequest = new Request(new URL(request.url || "/", "http://localhost"), {
            method,
            headers,
            ...(hasBody ? { body: request, duplex: "half" } : {}),
          });
          const result = await handler(webRequest, { ip: request.socket.remoteAddress });
          result.headers.forEach((value, name) => response.setHeader(name, value));
          response.statusCode = result.status;
          response.end(Buffer.from(await result.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  site: "https://nicolas-figueroa.me",
  trailingSlash: "always",
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    plugins: [tailwindcss(), localNetlifyFunctions()],
  },
});
