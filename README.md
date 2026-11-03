# Nicolas Figueroa — Portfolio

A static-first, AI-enhanced portfolio built with Astro and Tailwind CSS. Its core experience is designed to work independently of optional AI features.

The home page leads with The Guide. Guide responses are labeled as AI-generated
or evidence-only, and the generated answers remind readers to verify claims
against the cited sources. Resume views share verified profile data while
curating different role histories, skills, projects, section order, and summaries
for recruiters, engineering managers, leadership, and AI engineering audiences.

## Requirements

- Node.js 22.12 or newer
- npm
- Python 3.12 or newer for corpus scripts and Python tests

## Local development

```powershell
npm install
npm run dev
```

Astro serves the site at `http://127.0.0.1:4321/`. The Guide and Check Nico's Fit
endpoints are handled by a dev-only Vite middleware using the same function
handlers as production. The dev command loads variables from the root `.env`;
keep that file untracked. Netlify Forms submissions require a deployed Netlify
site and do not process submissions in local development.

Check Nico's Fit accepts pasted text or JSON, a public HTTPS page URL, or a
file in PDF, Word (DOC/DOCX), TXT, Markdown, CSV/TSV, JSON, HTML, or RTF format.
Uploads are limited to 2 MB; PDFs are text-extracted (scanned documents need
OCR elsewhere). URL input is limited to public HTTPS pages on port 443: private
or reserved IPs, redirects, non-HTML/text responses, and pages over 1 MB are
rejected. Input is processed in memory for the request and is not stored.
Each skill identified as a gap also appears in the beginner, intermediate, and
advanced growth estimates. These illustrative timelines assume 6–8 focused
study hours per week and are calibrated against documented education and
certification milestones. The combined estimate assumes skills are studied
sequentially and is not a promise of proficiency.

Card-based sections expand to as many as four columns on wide displays, while
keeping a single-column layout on small screens.

## Verification

```powershell
npm test
npm run build
```

The test command checks navigation, backend behavior, sourced content, and resume views. The build generates the static site in `dist/`.
Run all build, frontend, Python, and coverage checks with `npm run test:all`. Node coverage prints to the terminal; Python coverage reports are written to `coverage.xml` and `htmlcov/`.

Python corpus-pipeline and test tools are listed in `requirements.txt`; install them with:

```powershell
python -m pip install -r requirements.txt
```

## AI corpus

The Guide can display cited local evidence without an OpenAI key. To generate or refresh embeddings, run:

```powershell
python scripts/build_corpus.py
python scripts/chunk_content.py
$env:OPENAI_API_KEY = "your-key"
python scripts/generate_embeddings.py
```

Set `OPENAI_API_KEY` only in the root `.env` for local development or Netlify settings for deployment; never commit it. The generated `data/corpus.json`, `data/metadata.json`, and `data/embeddings.json` are versioned inputs to local search and Netlify Functions.

## Project structure

- `src/pages/` — Astro routes
- `src/layouts/` and `src/components/` — shared page structure and interface
- `src/content/` — JSON and Markdown content
- `src/styles/` — global theme and Tailwind CSS
- `functions/` — Node.js Netlify Functions for the Guide and Fit endpoints
- `scripts/` — Python corpus and embedding pipeline
- `tests/` — project tests

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [docs/](./docs/) for architecture decisions, requirements, and implementation guidance.

See [DEPLOY.md](./DEPLOY.md) for the Netlify build, function, environment
variable, and production verification settings.
