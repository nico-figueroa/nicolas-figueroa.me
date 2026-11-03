# Implementation Roadmap

Work in phases. Verify functionality, add relevant tests, update documentation, and leave a commit-ready state after each phase.

## Phase 1 — Foundation

- Create the Astro project with Tailwind CSS and Netlify configuration.
- Add basic routing, shared layout, theme system, and content directories.
- Document local setup and architecture.

## Phase 2 — Core Experience

- Build Home, Journey, Experience, Projects, Media, and Contact.
- Use reusable components and source portfolio content from Markdown or JSON.
- Use clearly marked placeholders until verified biography, project, and profile details are available.

## Phase 3 — Visual Identity

- Refine the neural-network-inspired visual system and node-based navigation.
- Support dark theme, mobile layouts, keyboard navigation, reduced motion, and WCAG AA accessibility.
- Keep animation subtle and performance-friendly.

## Phase 4 — Dynamic Resume Views

- Provide Recruiter, Engineering Manager, Leadership, and AI Engineering views.
- Derive each view from shared resume data and presentation filters; do not duplicate content.

## Phase 5 — AI Guide

- Build the content corpus, chunking, and embedding-generation pipeline.
- Store corpus, metadata, and embeddings as JSON and perform local similarity search.
- Serve live requests through the approved Node.js Netlify Function runtime (ADR-005).
- Add grounded answers, citations, supporting evidence, and suggested questions.
- Keep the feature optional; the portfolio must work when AI is unavailable.

## Phase 6 — Check Nico's Fit

- Analyze submitted job descriptions and return transparent match reasoning.
- Include strengths, relevant experience and projects, gaps, recommended content, and estimated growth projections.
- Label projections as estimates and never present them as guarantees.

## Phase 7 — Testing

- Add unit, integration, and accessibility tests for navigation, corpus generation, retrieval, AI Guide, and Fit analysis.
- Create coverage reports and document test execution.

## Phase 8 — Production Hardening

- Validate environment variables and sanitize and bound user input.
- Mitigate prompt injection, rate-limit AI endpoints, and provide explicit errors and graceful fallbacks.
- Verify that the static portfolio remains available when AI dependencies fail.
- Validate deployment, performance, accessibility, SEO, and security before release.
