# Architecture

## Foundation

The portfolio uses Astro's static-first rendering model. Astro components render pages at build time; browser-side behavior is limited to small vanilla JavaScript enhancements. Tailwind CSS is integrated through its Vite plugin. No UI framework or external content service is required.

Site copy and navigation are stored in JSON or Markdown under `src/content/`, separate from route components. Shared layouts and components keep page structure consistent. The initial theme is dark, with a user-operable light theme.

## Hosting and backend

Netlify builds the Astro site and publishes `dist/`. The `functions/` directory contains stateless Node.js Netlify Functions. Python scripts build the content corpus and embeddings; browser-side code never receives API secrets.
Local development runs Astro directly; a dev-only Vite middleware routes the Guide and Fit endpoints to the same handlers used in production.

AI capabilities are optional enhancements. The portfolio's static pages must continue to build and work when AI services or credentials are unavailable. Secrets belong only in Netlify environment variables and must never be embedded in the frontend.

### Netlify runtime exception

Netlify does not currently provide a Python runtime for Netlify Functions. With approval, live AI Guide and Fit endpoints use small, stateless Node.js Netlify Functions. Python remains responsible for corpus construction, chunking, and OpenAI embedding generation. The function layer uses plain JavaScript and the Node.js runtime already supported by Netlify; it adds no frontend framework or external service. This exception is recorded in [DECISIONS.md](./DECISIONS.md).

## Planned implementation sequence

1. Foundation: Astro, Tailwind CSS, Netlify configuration, shared layout, theme, and content structure.
2. Core portfolio: Home, Journey, Experience, Projects, Media, and Contact, backed by Markdown or JSON.
3. Visual identity and accessibility refinement.
4. Audience-specific resume views using shared content.
5. Evidence-grounded AI Guide with Python-built corpus, local similarity search, and a Node.js Netlify endpoint.
6. Transparent Check Nico's Fit analysis in a Node.js Netlify endpoint.
7. Unit, integration, and accessibility testing.
8. Production hardening and deployment verification.

The AI retrieval corpus remains a small, version-controlled JSON artifact for V1; no vector database is part of this architecture.

## Decisions

- Astro over a client-rendered application: static output with a small runtime surface.
- Tailwind CSS for styling, with vanilla JavaScript for interactions.
- Netlify for hosting and functions.
- Python for corpus construction and embedding workflows.
- Node.js Netlify Functions for live endpoints, because Netlify does not support Python Functions; this approved exception is documented in ADR-005.
- Markdown and JSON as the content formats.
- OpenAI access is isolated to backend functions and is not required for the portfolio itself.
- Fit input supports bounded text/JSON, document uploads, and public HTTPS job pages; URL retrieval pins a DNS-validated public address, rejects redirects, and enforces response limits to prevent server-side request forgery.

These decisions follow [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), [TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md), and [DECISIONS.md](./DECISIONS.md).
