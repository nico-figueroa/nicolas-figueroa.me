# Architecture

## Foundation

The portfolio uses Astro's static-first rendering model. Astro components render pages at build time; browser-side behavior is limited to small vanilla JavaScript enhancements. Tailwind CSS is integrated through its Vite plugin. No UI framework or external content service is required.

Site copy and navigation are stored in JSON or Markdown under `src/content/`, separate from route components. Shared layouts and components keep page structure consistent. The initial theme is dark, with a user-operable light theme.

Professional evidence is cataloged in `src/content/evidence.json`; the source PDFs remain under `src/content/resume/` and `src/content/media/`. A statically generated PDF endpoint publishes each catalog entry at `/evidence/<id>.pdf`, while the manifest connects records to education, certifications, achievements, and skills.

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

The AI retrieval corpus remains a small, version-controlled JSON artifact for V1; no vector database is part of this architecture. Corpus generation combines profile, project, About, achievement, and evidence metadata. Local evidence citations resolve to portfolio routes; entries without a matching embedding remain searchable through lexical retrieval.

## Decisions

- Astro over a client-rendered application: static output with a small runtime surface.
- Tailwind CSS for styling, with vanilla JavaScript for interactions.
- Netlify for hosting and functions.
- Python for corpus construction and embedding workflows.
- Node.js Netlify Functions for live endpoints, because Netlify does not support Python Functions; this approved exception is documented in ADR-005.
- Markdown and JSON as the content formats.
- OpenAI access is isolated to backend functions and is not required for the portfolio itself.
- Fit input supports bounded text/JSON, document uploads, and public HTTPS job pages; URL retrieval pins a DNS-validated public address, rejects redirects, and enforces response limits to prevent server-side request forgery.
- Live Fit uses `fit-ai.mjs` and two OpenAI Responses requests with strict JSON schemas. Classification reads the complete extracted description, separates atomic requirements from benefits, employer commentary and application information, and records original quotations and exclusion reasons. Numbered passages track coverage without interpreting semantics: the schema requires at least one classification for every passage, including headings, and code rejects omissions. Repeated normalized criteria are merged before assessment; required wording takes precedence over preferred wording. Assessment receives only classified requirements and a curated public source registry (skills, dated roles, education, achievements, projects, credentials and documentation). Source text and job descriptions are untrusted data, never instructions. `OPENAI_MODEL` defaults to `gpt-4.1-mini`, as for the Guide.
- Code checks bounded response fields, original job quotations, unique normalized keys and labels, exactly one assessment per requirement, allowed evidence ids, confidence bounds and consistent result/evidence states. Concept keys are free text normalized in code, retaining meaningful technology punctuation such as `C++` and `C#`; model-generated slug syntax is not required. Code assigns requirement identifiers, and the assessment schema uses a required object property for each identifier, preventing omitted, repeated or invented assessment slots. Schema alternatives require citations for supported/partial findings and no citations for gaps. Citation ids are constrained by schema enums. Code attaches original source excerpts rather than asking the model to reproduce quotations, preventing fabricated or abbreviated evidence quotes. Invalid, incomplete, refused, unavailable, timed-out or unconfigured model responses return explicit errors with no score. Both calls share a 45-second deadline. There are no automatic paid retries or silent rules-based fallbacks. Application logs contain failure codes, not submitted text, provider response bodies or credentials. Responses request `store: false`; provider retention remains governed by OpenAI's terms and settings.
- The model evaluates semantic equivalence, higher qualifications, transferable human skills, degree field/level, specialist tenure and domain/capability separation, then performs an internal contradiction audit and writes an evidence-based summary. Structural code validation does not prove semantic correctness; the UI explicitly states that AI judgments can be wrong. `fit.mjs` retains the legacy deterministic evaluator for regression comparisons only; the live endpoint invokes only `analyzeFitWithAI`.
- Every requirement returns evidence, verified citations and quotations, evidence type, confidence, and `Exceeds`, `Meets`, `Partially Meets`, or `Gap`. Code calculates the score from these findings: required weight 2, preferred weight 1; direct/equivalent/exceeding evidence earns full credit, adjacent evidence 35%, and gaps zero. All report lists derive from this same validated list, never a second keyword scan. Only technical-skill and engineering-capability gaps receive illustrative study estimates; credentials, education, tenure, responsibilities, human capabilities and industry-domain gaps do not.
- The summary combines code-calculated statistics with the model's narrative. Transferable capabilities and excluded content have separate expandable sections. Benefits administration remains assessable work when the job actually requests it, rather than an employer-provided perk. Automated mocked tests cover contracts/failure paths; `npm run test:fit-live` evaluates real model behavior on synthetic varied job descriptions when an OpenAI key is available.
- Classification schema alternatives enforce category/importance compatibility: assessable categories accept only required/preferred, while excluded categories accept only informational. The model cannot emit contradictory combinations that the application would subsequently reject. Employer descriptions of technologies, scale or domains are context, not candidate requirements unless the posting actually requests that experience. These constraints apply to every submission without employer-specific rules or phrase exceptions. Tests enumerate all category/importance combinations. Code attaches the original input passage to each classified item instead of requesting generated quotations; a passage can contain both criteria and excluded material, so its label/category, not every word in the passage, defines what is scored.

These decisions follow [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), [TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md), and [DECISIONS.md](./DECISIONS.md).
