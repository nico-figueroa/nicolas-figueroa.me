# GitHub Copilot Instructions

Treat this repository as a production-grade portfolio application.

Review all documentation in /docs before implementation.

Priority order:

1. PRODUCT_REQUIREMENTS.md
2. VISION_AND_BRAND.md
3. SYSTEM_ARCHITECTURE.md
4. TECHNICAL_SPECIFICATION.md

Principles:

- Prefer simplicity
- Prefer maintainability
- Prefer static generation
- Use Python for corpus construction and embeddings.
- Use the approved Node.js Netlify Functions exception for live endpoints (ADR-005); do not introduce a second hosting platform.
- Avoid unnecessary dependencies

All AI responses must be grounded.

All AI features must include citations.

The website must function without AI.

The visual design should communicate:

"Exploring how complex systems learn, adapt, and evolve."

Do not introduce additional technologies without justification and documentation.