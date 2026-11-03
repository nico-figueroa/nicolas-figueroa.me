# Content

Keep portfolio copy and metadata in this directory rather than in route components.

- `site.json` contains global identity and home-page content.
- `navigation.json` defines the primary navigation.
- `pages.json` provides initial copy for the static routes.
- `projects.json` contains sourced project descriptions, repository links, and available production URLs.
- `resume.json` holds shared resume sections and the four audience views.
- `profile.json` contains sourced experience, education, certification, language, and skills information.
- `contact.json` contains public profile links.
- The `journey/`, `experience/`, `projects/`, `media/`, and `resume/` directories are reserved for Markdown content added in later phases.

Keep claims tied to the source links in the content. Replace or remove placeholder copy only when verified information is available.

Profile details are sourced from the LinkedIn profile export and cite the canonical LinkedIn URL; project details are sourced from GitHub repository READMEs. The public profile content omits the exported home address and mobile number. Production links are maintained with each project so frontend, API, and live-app deployments remain discoverable.
