# Technical Specification

## Frontend Requirements

### Astro

Latest stable version.

### Styling

TailwindCSS.

### Components

Reusable Astro components.

### Accessibility

WCAG AA minimum.

### Responsive Design

Mobile First.

Tablet Support.

Desktop Support.

---

# Backend Requirements

Python 3.12+ for corpus generation, chunking, embedding generation, and Python tests.

Node.js Netlify Functions for stateless live API requests. Netlify does not support Python Functions; the approved runtime exception and rationale are recorded in `DECISIONS.md` (ADR-005).

OpenAI credentials are optional. When unavailable, static pages remain functional and the AI Guide returns cited local evidence without generated answers.

---

# AI Retrieval Pipeline

Question

↓

Chunk Retrieval

↓

Embedding Search

↓

Top K Results

↓

Prompt Assembly

↓

OpenAI Completion

↓

Answer + Citations

---

# Embedding Storage

Version 1:

embeddings.json

No external vector DB.

---

# Logging

Minimal.

No storage of personal visitor information.

---

# Analytics

Cookie-free preferred.

Privacy-respecting.