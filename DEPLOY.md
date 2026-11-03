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

In **Site configuration → Environment variables**, add:

| Variable | Required? | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Enables OpenAI-generated Guide answers and embedding-based query search. Without it, the Guide still returns matching local evidence. |
| `OPENAI_MODEL` | No | Guide model override. Defaults to `gpt-4.1-mini`. |
| `OPENAI_EMBEDDING_MODEL` | No | Embedding model override. Defaults to the model recorded in `data/embeddings.json`. |

Set secrets in Netlify, not in source files or committed `.env` files. For
production AI responses, make `OPENAI_API_KEY` available to the production
deploy's Functions. Add it to Deploy Previews only if previews should also use
the paid OpenAI service. Do not expose it as a client-side/public build variable.
The site and its evidence-only Guide fallback work when these variables are
unset.

## Deploy and verify

After saving the settings, trigger the initial deploy. Subsequent commits
pushed to `main` deploy automatically; other branches can use Deploy Previews.
The existing [`netlify.toml`](./netlify.toml) also configures response security
headers and the Node.js Functions directory.

After deployment, verify:

- The home page and content routes load.
- `/.netlify/functions/ai-guide` and
  `/.netlify/functions/check-nicos-fit` respond when submitted through their
  site forms.
- The Contact form appears under **Forms** in the Netlify site dashboard after
  a successful production deploy. Its form name is `contact`; configure email
  notifications under **Forms → Notifications** if desired.
- If the Guide is used without an OpenAI key, it should return local cited
  evidence instead of generated answers.

## Local checks before deployment

```powershell
npm ci
npm run test:all
```

`npm run build` creates the `dist` directory that Netlify publishes.
`npm run dev` runs Astro locally; Netlify Forms submissions are processed only
by a deployed Netlify site.
