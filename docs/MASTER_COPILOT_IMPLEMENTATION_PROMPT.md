You are acting as the lead software architect and implementation engineer for this repository.

Your primary objective is to build the first production-ready version of this portfolio application using the documentation already present in the repository.

Before performing any modifications:

1. Read ALL files inside the /docs directory.
2. Treat those documents as authoritative requirements.
3. Resolve conflicts by prioritizing:

   PRODUCT_REQUIREMENTS.md
   VISION_AND_BRAND.md
   SYSTEM_ARCHITECTURE.md
   TECHNICAL_SPECIFICATION.md

4. Do NOT introduce major technologies that are not explicitly approved by the architecture documentation.
5. Use Python for the corpus and embedding pipeline. Netlify's lack of a Python Functions runtime requires the approved plain-JavaScript endpoint exception documented in ADR-005.
6. Prefer simplicity over framework complexity.
7. Minimize dependencies.
8. Implement production-quality code.
9. Create tests alongside implementation.
10. Update documentation when architectural decisions change.

--------------------------------------------------
PROJECT OBJECTIVE
--------------------------------------------------

Build an AI-enhanced personal portfolio website for Nicolas Figueroa.

Core brand statement:

"Exploring how complex systems learn, adapt, and evolve."

The platform is:

- Professional portfolio
- Project showcase
- Interactive professional journey
- AI-assisted exploration experience

The site must function correctly even when all AI features are disabled.

AI is an enhancement, not a dependency.

--------------------------------------------------
TECHNOLOGY CONSTRAINTS
--------------------------------------------------

Frontend:
- Astro
- TailwindCSS
- Vanilla JavaScript

Backend:
- Python content and embedding pipeline
- Node.js Netlify Functions for live endpoints, per approved ADR-005

Hosting:
- Netlify

AI:
- OpenAI API

Content:
- Markdown
- JSON

Deployment:
- GitHub -> Netlify CI/CD

Do NOT introduce:

- Next.js
- React-only implementation
- Vue
- Angular
- External vector databases
- Pinecone
- Weaviate
- Chroma
- Supabase

for V1 without first documenting the reasoning.

--------------------------------------------------
IMPLEMENTATION STRATEGY
--------------------------------------------------

Execute work in phases.

Do not attempt to build everything simultaneously.

After each phase:

- verify functionality
- create tests
- update documentation
- commit-ready state

--------------------------------------------------
PHASE 1
FOUNDATION
--------------------------------------------------

Create:

- Astro project structure
- Tailwind integration
- Netlify configuration
- Basic routing
- Layout system
- Theme system
- Content directory structure

Create:

README.md
docs/ARCHITECTURE.md
requirements.txt
.gitignore

Ensure local setup is documented.

--------------------------------------------------
PHASE 2
CORE EXPERIENCE
--------------------------------------------------

Implement:

Home
Journey
Experience
Projects
Media
Contact

Use placeholder content when actual content is unavailable.

Create reusable components.

Favor content-driven architecture.

All content should be sourced from Markdown or JSON.

Do not hardcode content into page components.

--------------------------------------------------
PHASE 3
VISUAL IDENTITY
--------------------------------------------------

Implement:

- Neural-network-inspired theme
- Node-based navigation concepts
- Subtle animations
- Dark theme
- Accessibility support
- Mobile responsiveness

Design goals:

Curiosity
Professionalism
Clarity

Avoid:

- hacker aesthetics
- movie cosplay
- excessive animation

--------------------------------------------------
PHASE 4
DYNAMIC RESUME VIEWS
--------------------------------------------------

Implement audience-specific resume views:

- Recruiter
- Engineering Manager
- Leadership
- AI Engineering

Use shared data with presentation filters.

Do not duplicate content.

--------------------------------------------------
PHASE 5
AI GUIDE
--------------------------------------------------

Implement "The Guide"

Capabilities:

- Question answering
- Source grounding
- Citation generation
- Suggested follow-up questions

Create:

scripts/build_corpus.py
scripts/chunk_content.py
scripts/generate_embeddings.py

Store artifacts in:

data/corpus.json
data/metadata.json
data/embeddings.json

No vector database.

Use local similarity search against embeddings.

Implement:

functions/ai-guide/

Responses must include:

Answer
Supporting Evidence
Sources
Suggested Questions

Never allow unsupported claims.

--------------------------------------------------
PHASE 6
CHECK NICO'S FIT
--------------------------------------------------

Implement:

Check Nico's Fit

User submits:

Job description text

Return:

- Match score
- Relevant skills
- Relevant experience
- Relevant projects
- Potential gaps
- Growth projection
- Recommended content

Implement transparent reasoning.

Growth projections must be explicitly labeled as estimates.

Growth projections may use:

- MSIM completion history
- Full Stack certification history
- AI Engineering certification history
- Learning milestones documented in content

Never represent projections as guarantees.

--------------------------------------------------
PHASE 7
TESTING
--------------------------------------------------

Create:

Unit tests
Integration tests
Accessibility tests

Cover:

Navigation
Corpus generation
Similarity search
AI Guide
Fit analyzer

Create test coverage reports.

Document execution instructions.

--------------------------------------------------
PHASE 8
PRODUCTION HARDENING
--------------------------------------------------

Implement:

Environment variable validation

Input sanitization

Prompt injection mitigation

Rate limiting

Error boundaries

Fallback experiences

Graceful AI failure handling

Site must still function if OpenAI API is unavailable.

--------------------------------------------------
WORKSPACE ANALYSIS REQUIREMENT
--------------------------------------------------

Before generating any implementation:

1. Analyze repository structure.
2. Analyze all documentation.
3. Produce an implementation plan.
4. Identify gaps or conflicts.
5. Recommend improvements.
6. Then begin implementation.

Do not ask for confirmation unless critical information is missing.

When uncertain:

Prefer maintainability.
Prefer simplicity.
Prefer documented requirements.

The portfolio itself should be treated as a flagship engineering project demonstrating:

- Systems Thinking
- AI Engineering
- Information Architecture
- Software Engineering
- Technical Problem Solving

Every implementation decision should reinforce the brand statement:

"Exploring how complex systems learn, adapt, and evolve."