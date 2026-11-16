# Content Model

## Journey

Education records and source links are rendered from `profile.json` and mapped through `evidence.json`. The Journey page exposes education at `#education` and credentials at `#certificates`.

About narrative, principles, optional portrait metadata, and timeline entries live in `about.json`.

---

## Resume

Summary

Skills

Experience

Education

Certifications

Achievements

Audience-specific Resume views use shared profile, skills, achievement, and evidence mappings. The source Resume and supporting PDFs are available from the evidence manifest.

Credentials are maintained newest-first in `profile.json`, beginning with Microsoft's GitHub Copilot Proficient badge, AI Engineer, and Full-Stack Engineer. The shared `CertificationCards.astro` component preserves that order on Journey and every audience-specific Resume view. Optional `issuedOn`, `expiresOn`, and `detail` fields carry sourced completion/issue dates, expiry, and credential scope. The Copilot credential is a Verified Proficiency product-usage badge, not an exam-based Microsoft certification. About omits the evidence library and certification cards. Undated legacy training does not display invented completion dates.

The current resume PDF and owner-supplied LinkedIn profile export are merged rather than treated as competing replacements. LinkedIn supplies detailed career titles and dates; the resume supplies grouped organizational scope, outcomes, and skills. Grouped outcomes remain in `profile.achievements` with resume evidence rather than being assigned speculatively to individual roles. The raw LinkedIn export is not published or ingested wholesale; retrieval uses curated content without private contact details.

`profile.headline` is the canonical professional headline used by Home, About, Resume views, and both AI source feeds. `site.json` retains "Exploring how complex systems learn, adapt, and evolve." as the main brand statement, with business value in the supporting introduction; `about.json` leads with the supplied LinkedIn About and retains the existing personal narrative. Resume summaries tailor emphasis without changing underlying evidence. Business needs, process simplification, and existing-tool fit precede software, automation, and AI. Industry-specific history remains evidence of transferable skills, not a restriction on positioning. Cloud skills remain explicitly at fundamentals level.

Skills are grouped into languages, platforms/frameworks, software engineering, data, AI/ML, leadership, business, process design and simplification (`processSimplification`), continuous improvement (`continuousImprovement`), and engineering practices. The two process-focused groups replace quality-system and medical-device skill cards in the same audience views. Their transferable skills emphasize statistics, process design, validation, Lean, Six Sigma, Gemba observation, root-cause problem solving, and improvement measurement. ISO identifiers and industry-specific role labels are not listed as skills; accurate industry context remains in career history, outcomes, and source evidence. Guide and Fit consume the same updated skill groups.

---

## Projects

`projects.json` supplies the Projects page, selected projects in Resume views, and project evidence for Guide and Fit. `source` is the public citation URL: normally the repository, or the published website when the repository is private. `productionLinks` identifies deployed applications. If a deployment URL is also the source, the project card renders that deployment link once without labeling it as a source repository. Private repository URLs are not published.

AI Video Studio documents estimate-first AI story and narrated-video production, with user-controlled quality/cost tradeoffs and local rendering. Estimates are not provider quotes or actual invoice totals. It also produced the commercially available video generator builder AI agent skill on Agensi. `relatedLinks` records a label, public URL, and factual description for resources such as this skill: they appear on project and Resume cards and receive their own Guide/Fit citations, without implying the parent application is deployed or claiming sales volume. Casa Perla documents a bilingual vacation-rental website and cites only its public site; its private repository is not linked. Both projects appear in all four Resume views.

AI Engineering Lessons highlights its XERJ Corpus Hub selection and the banking-classification capstone using MLP and RoBERTa with PII protections. The contributor listing is a related resource with its own public citation. XERJ indexes the whole repository at a pinned commit; do not present this as proof of model training, performance validation, or endorsement.

The home network map models four left-to-right neural layers: About/Journey/Education (inputs), Experience/Projects/Certificates (applied learning), Resume/Media (evidence synthesis), and Guide/Fit (outputs). Adjacent layers are fully connected. Six-second forward passes alternate with six-second backpropagation passes, reversing connector motion and arrowheads. During backpropagation, bounded illustrative weights change randomly every 1.5 seconds, updating line thickness, opacity and centered sample readouts. ReLU, sigmoid, summation and training cycles are navigation metaphors, not a depiction of the Fit model's architecture or live learning; this disclaimer appears beneath the diagram. All node buttons retain the same 12rem by 3.5rem dimensions and theme colors. The wide home layout places text on the left and the diagram on the right from 64rem; smaller screens stack them. A labeled keyboard-focusable horizontal region preserves readable buttons when the available diagram width is less than 60rem without page overflow. Animation runs continuously without a pause/resume button or visibility-triggered reset, except when reduced-motion preferences disable it. Leaving the page cleans up the timer.

The diagram now scales to its container at every width without an internal scrollbar, superseding the fixed node dimensions and horizontal-region behavior above. Desktop uses a balanced text/diagram grid, fluid heading and node text sizes, and a diagram height bounded between 24rem and 35rem. Below 64rem, four layers run top-to-bottom with wrapping buttons and a viewport-aware height bounded between 36rem and 45rem. Mobile-specific connectors follow the same topology vertically and reverse during backpropagation. Nodes preserve at least 44px touch height; normal vertical page scrolling remains available for content that exceeds the viewport.
Desktop adds a compact 2.5rem offset to the node/connector coordinate area, keeping layer labels and activation symbols clear of the first row without a large empty band. Mobile activation symbols use tighter vertical spacing.

Network layer/node positions and footer platform masks are defined in the external stylesheet using data attributes, not inline style attributes. Netlify's `style-src 'self'` policy blocks inline styles; production checks must include this header to catch differences from the development server.
Vite's `assetsInlineLimit` is zero so Astro emits even small scripts and styles as external assets, compatible with the same-origin-only script/style policy. This also keeps the network animation script executable in production without weakening CSP.

AI Trip Planner

Nomadant Tech

IntakeWise

RESTful Restaurants

Tutare

UnboundRoot

Portfolio Site

---

## Media

YouTube links and presentation galleries are defined in `media.json`. Presentation cards refer to PDF records in `evidence.json` and are generated from that metadata.

## Evidence

`evidence.json` is the source-document registry. Each record defines its source file, public title, category, supporting skill areas, and Guide knowledge text. Profile education, certifications, and achievements link to registry IDs.

## Privacy

The site-specific Privacy Policy is a routed page backed by `privacy.json`, linked as a button in the shared footer and from each submission form. It covers OpenAI processing for both The Guide and Fit, including extracted Fit document/page text, and Netlify contact-form handling independently of other websites.

The mobile header places the name and theme control in its first row and centers "Browse portfolio sections" below them. Expanded navigation uses two centered columns with the button font and weight; an unpaired final link is centered across both columns. The footer does not duplicate that menu.
Footer contact buttons map `contact.json` entries to locally hosted Simple Icons v11 platform SVGs under `public/images/platforms/`, using Microsoft Outlook for Email. CSS masks inherit the site's text color in both themes. Privacy Policy and Back to Home use matching outline shield and home icons. All icons are decorative; button labels remain accessible.

Content cards use `ResponsiveCard.astro`: native keyboard-accessible disclosures initially collapsed below 64rem and expanded on desktop. `responsive-cards.js` synchronizes breakpoint changes for cards marked `data-responsive-card`. Single-line labels and form fields are not hidden in disclosures.
Fit's 13 report sections use `alwaysCollapsible` and remain initially closed at every viewport width, including nested assessment and growth details. Each new analysis resets the report sections. The always-visible summary shows code-calculated evidence coverage and gap count (including domain gaps, excluding partial matches), illustrative beginner/intermediate/advanced learning estimates, and an evidence-based model narrative. Learning estimates do not guarantee gap closure. Empty extraction returns an explicit request for assessable qualifications instead of a misleading zero-fit report.
Interpersonal and transferable capabilities have a separate expandable report section and do not appear in Relevant Skills or technology-learning projections. They remain evidence-assessed requirements, not automatic gaps or assumed personality traits. Only technical-skill and engineering-capability gaps receive study estimates; domains, human capabilities, education, credentials, tenure and other nontechnical requirements do not. Excluded Job-description Content shows benefits, employer commentary and application information with exclusion reasons. Each assessment shows original wording, category, importance, result, rationale, confidence and verified source quotations.

The Guide and Check Nico's Fit pages use the layout's `fluid` mode: the centered page occupies 75% of the viewport from 64rem upward, retaining standard side padding; smaller screens use the available width. Report sections form two columns from 80rem upward, while summaries, answers, assessment, and growth sections span the report width. Assessment, growth, project, and Guide evidence subcards use an auto-fitting grid with a 20rem preferred minimum that shrinks safely on mobile. Other pages retain their existing width limits.
All report disclosure titles use the shared flex layout with a single right-aligned chevron, not a native marker plus an inline chevron. While Fit is processing, its polite status region rotates through 24 professional, lighthearted messages every three seconds after the initial input-specific status. Rotation stops on success or failure; messages are waiting copy, not claims of measurable backend progress.
A blue wheel appears beside Fit's progress messages only while a request is running, and hides on success or failure. Its decorative rotation is disabled for reduced-motion preferences.

Completed Guide answers and Fit reports automatically scroll into view with a small top clearance. Scrolling is smooth unless reduced motion is requested, in which case it is immediate. Failed requests do not trigger result scrolling.

Project technologies and all Resume skill groups use shared `TechnologyBanners.astro` banners within their cards, except spoken languages, which retain their flags and proficiency text. This includes leadership, business and operations, process simplification, and continuous improvement. `technology-badges.json` maps these skills to locally hosted Shields.io `for-the-badge` SVGs with case-insensitive lookup. Existing technical badges are preserved. Skills naming a technology or vendor use its recognizable logo when available, including AWS/Azure fundamentals and SAP implementation support. Generic skills use matching text badges without unrelated vendor marks; improvement methods reuse the existing green palette. These are README-style badges, not claims of vendor endorsement or certification. Unregistered future entries retain readable text labels; regression tests require badge coverage for every profile skill group and verify logo-bearing versus generic entries.

When adding skills to a badge-backed group in `profile.json`, add any missing mapping and its local SVG under `public/images/technologies/`. Match the colors and logo treatment of equivalent entries, and preserve the skill's label on its badge.

`SpokenLanguages.astro` displays the complete proficiency text with a USA flag beside English and a Costa Rica flag beside Spanish, in Journey and all Resume views. Flag images are local copies from FlagCDN; no visitor requests go to badge or flag services.

Education and certification records identify their `institution`. `OrganizationLogo.astro` resolves that name against `institutions.json`, which records local logo assets and their sources. Logos retain their original colors and proportions on a contrasting panel in both themes. The Blackberry & Cross and New Horizons logos were supplied by the site owner; the other logos come from the institutions' official sites. Missing organization metadata fails the build rather than displaying a guessed issuer or logo.

Career-history cards on Experience and every Resume view use the same logo component, resolving `position.organization` against `companies.json`. Employer names remain visible below their logos. Philips, Western Union, and Hispanoamerican University assets come from their official sites; the Hospira and Philips Volcano images were supplied by the site owner. The Volcano card retains its historical employer name even though the supplied image includes Philips branding.

---

## Profiles

GitHub

LinkedIn

Handshake

Codecademy

---

## AI Corpus

Resume Content

Project Content

Journey Content

Profile Metadata

The Guide corpus includes the shared headline, About narrative and principles, curated resume knowledge and achievements, and credential issuer, dates, scope, and direct credential citations. Fit reads the same profile, skills, achievements, credentials, and evidence registry at runtime; it does not use the Guide vector corpus. Rebuild source documents and chunks, then regenerate embeddings after changing corpus text so stable chunk IDs do not retain vectors for old text.
