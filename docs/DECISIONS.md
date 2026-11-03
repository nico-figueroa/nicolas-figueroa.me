# Architecture Decision Record

## ADR-001

Selected Astro instead of Next.js.

Reason:

Lower complexity.

Better alignment with current experience.

Static-first architecture.

---

## ADR-002

Selected Netlify instead of Vercel.

Reason:

Existing account.

Adequate functionality.

Reduced platform sprawl.

---

## ADR-003

Selected Python for backend logic.

Status: Superseded for live Netlify Functions by ADR-005. Python remains the corpus and embedding-pipeline language.

Reason:

Primary language.

Supports AI workflows.

Higher productivity.

---

## ADR-004

Selected JSON embeddings instead of vector database for V1.

Reason:

Small corpus size.

Zero infrastructure.

Lower cost.

---

# ADR-005

## Use Node.js for live Netlify Functions

### Status

Accepted

### Context

The architecture originally specified Python Netlify Functions. [Netlify's Functions documentation](https://docs.netlify.com/build/functions/configuration/) and [Functions platform overview](https://www.netlify.com/platform/functions/) document the supported Node.js runtime and do not provide Python function entry points. Attempting to deploy Python handlers on Netlify would leave the AI and fit endpoints unavailable.

### Decision

Use plain JavaScript in Node.js Netlify Functions for live AI Guide and fit-analysis requests. Keep Python for corpus construction, chunking, embedding generation, and associated tests. Do not introduce a second hosting platform or a frontend framework.

### Consequences

- The AI and fit endpoints use the runtime Netlify actually supports.
- Python remains in the content/embedding pipeline, not in deployed function execution.
- This is a documented exception to the original Python-backend requirement, approved by the project owner.
- The static portfolio and evidence-only AI fallback remain usable without OpenAI credentials.