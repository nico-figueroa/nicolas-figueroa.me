# Netlify deployment

This repository is configured for Netlify's Git-based continuous deployment.
The project root is the repository root; the site is built as static Astro
output, with Node.js Netlify Functions for the Guide and Fit endpoints.

## Connect the repository

1. In Netlify, choose **Add new site → Import an existing project** and connect
   the GitHub repository `nico-figueroa/nicolas-figueroa.me`.
2. Select `main` as the production branch.
3. Use the build settings below. `netlify.toml` already defines these values,
   so Netlify should detect them automatically.

| Netlify setting | Value |
| --- | --- |
| Base directory | Leave blank (repository root) |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `functions` |
| Package manager | npm (`package-lock.json`) |
| Node.js version | 22.x (the repository sets `NODE_VERSION = "22"`; package requires Node.js 22.12 or newer) |

No separate adapter, install command, or Python runtime is needed to deploy.
Netlify installs the npm dependencies from the lockfile. Python is used only
for the corpus-building scripts and tests, not for deployed Functions.

## Environment variables

In **Site configuration → Environment variables**, add only:

| Variable | Required? | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | For Fit and generated Guide answers | Enables Fit classification/assessment, generated Guide answers and embedding-based query search. Without it, Fit returns an explicit unavailable error; the Guide still returns matching local evidence. |

Set secrets in Netlify, not in source files or committed `.env` files. For
production AI responses, make `OPENAI_API_KEY` available to the production
deploy's Functions. Add it to Deploy Previews only if previews should also use
the paid OpenAI service. Do not expose it as a client-side/public build variable.
The application has built-in model defaults, so do not add `OPENAI_MODEL` or
`OPENAI_EMBEDDING_MODEL` as Netlify secret variables. Their non-secret model
identifiers also appear in source and corpus metadata, which causes Netlify's
secret scanner to reject the build when it treats those values as secrets.
The site and its evidence-only Guide fallback work when `OPENAI_API_KEY` is
unset. Fit requires the key; it does not fall back to rules-based scoring.

### If Netlify reports model values as exposed secrets

Open **Site configuration → Environment variables** and delete
`OPENAI_MODEL` and `OPENAI_EMBEDDING_MODEL` from the site and any shared/team
environment configuration. They are optional overrides, not credentials; this
project uses its built-in model defaults. Keep the secret scanner enabled and
leave `OPENAI_API_KEY` configured if Fit or generated Guide answers are wanted.
Then trigger a fresh deploy.

If a Guide request displays “Failed to fetch,” open the deployed page and
`/.netlify/functions/ai-guide` in a private/incognito window. A `401` from both
URLs indicates site/deploy access protection, not an OpenAI configuration
problem. Make the production site publicly accessible, then retry. Without an
OpenAI key the function should still return cited local evidence.

## Deploy and verify

After saving the settings, trigger the initial deploy. Subsequent commits
pushed to `main` deploy automatically; other branches can use Deploy Previews.
The existing [`netlify.toml`](./netlify.toml) also configures response security
headers and the Node.js Functions directory.

The Content Security Policy allows same-origin Function requests and scripts.
Keep the closing quote in the `connect-src 'self';` directive intact; a
malformed directive blocks browser calls to the Guide and Fit endpoints.
Theme behavior is served from `/scripts/theme-toggle.js` so the static pages
do not need an inline-script exception.

After deployment, verify:

- The home page and content routes load.
- `/.netlify/functions/ai-guide` and
  `/.netlify/functions/check-nicos-fit` respond when submitted through their
  site forms.
- The production site's visitor-access settings allow public requests. Site or
  deploy protection can return `401 Unauthorized` for both pages and Functions
  before application code runs; keep production public for a public portfolio
  and apply access restrictions to previews only if desired.
- The Contact form appears under **Forms** in the Netlify site dashboard after
  a successful production deploy. If it does not, enable form detection in
  **Forms** and redeploy. Its form name is `contact`; configure email
  notifications under **Forms → Notifications** if desired.
- If the Guide is used without an OpenAI key, it should return local cited
  evidence instead of generated answers.
- Fit makes two sequential OpenAI requests under a shared 45-second model deadline.
  Ensure the deployed synchronous Function execution limit permits the full request,
  including input extraction (allow at least 60 seconds). A shorter hosting timeout
  can interrupt the request before the application can return its explicit error.
- Verify Fit excludes benefits/commentary, displays cited evidence and classifies
  human capabilities separately. Only technical/engineering gaps get study estimates.

## Local checks before deployment

```powershell
npm ci
npm run test:all
```

`npm run build` creates the `dist` directory that Netlify publishes.
`npm run dev` runs Astro locally; Netlify Forms submissions are processed only
by a deployed Netlify site.

`npm run test:fit-live` uses the root `.env` key to run a small synthetic job-description
evaluation against the real Fit model (two paid requests per case). It checks semantic
classification and evidence conclusions, unlike mocked unit tests. Run it before
deploying model or prompt changes. It fails if the key is missing or checks fail.
Local changes to backend modules imported by `astro.config.mjs` require restarting
the development server; browser refresh alone does not reload those handlers.
