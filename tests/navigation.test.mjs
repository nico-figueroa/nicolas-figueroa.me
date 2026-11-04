import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentDirectory = new URL("../src/content/", import.meta.url);
const navigation = JSON.parse(
  await readFile(new URL("navigation.json", contentDirectory), "utf8"),
);
const pages = JSON.parse(await readFile(new URL("pages.json", contentDirectory), "utf8"));
const projects = JSON.parse(await readFile(new URL("projects.json", contentDirectory), "utf8"));
const resume = JSON.parse(await readFile(new URL("resume.json", contentDirectory), "utf8"));
const contact = JSON.parse(await readFile(new URL("contact.json", contentDirectory), "utf8"));
const media = JSON.parse(await readFile(new URL("media.json", contentDirectory), "utf8"));
const evidence = JSON.parse(await readFile(new URL("evidence.json", contentDirectory), "utf8"));
const profile = JSON.parse(await readFile(new URL("profile.json", contentDirectory), "utf8"));
const site = JSON.parse(await readFile(new URL("site.json", contentDirectory), "utf8"));
const about = JSON.parse(await readFile(new URL("about.json", contentDirectory), "utf8"));
const privacy = JSON.parse(await readFile(new URL("privacy.json", contentDirectory), "utf8"));
const guideForm = await readFile(
  new URL("../src/components/GuideForm.astro", import.meta.url),
  "utf8",
);
const resumePage = await readFile(
  new URL("../src/pages/resume/[audience].astro", import.meta.url),
  "utf8",
);
const guidePrompt = await readFile(
  new URL("../src/components/GuidePrompt.astro", import.meta.url),
  "utf8",
);
const siteHeader = await readFile(
  new URL("../src/components/SiteHeader.astro", import.meta.url),
  "utf8",
);
const netlifyConfig = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
const slugPage = await readFile(new URL("../src/pages/[slug].astro", import.meta.url), "utf8");
const networkMap = await readFile(
  new URL("../src/components/NetworkMap.astro", import.meta.url),
  "utf8",
);
const layout = await readFile(
  new URL("../src/layouts/SiteLayout.astro", import.meta.url),
  "utf8",
);

test("navigation destinations have matching page content", () => {
  const pagePaths = new Set(pages.map((page) => `/${page.slug}/`));

  for (const item of navigation) {
    assert.ok(pagePaths.has(item.href), `Missing page content for ${item.href}`);
  }
});

test("the About and Privacy pages are routed and linked from the appropriate surfaces", () => {
  assert.ok(pages.some((page) => page.slug === "about"));
  assert.ok(navigation.some((item) => item.href === "/about/"));
  assert.ok(pages.some((page) => page.slug === "privacy-policy"));
  assert.match(layout, /href="\/privacy-policy\/"/);
  assert.ok(about.paragraphs.length > 0);
  assert.ok(privacy.sections.length > 0);
});

test("mobile navigation keeps Browse portfolio sections in the header only", () => {
  assert.match(siteHeader, /data-navigation-toggle/);
  assert.match(siteHeader, /aria-controls="site-navigation"/);
  assert.match(siteHeader, /id="site-navigation"/);
  assert.match(siteHeader, /Browse portfolio sections/);
  assert.ok(siteHeader.indexOf("data-theme-toggle") < siteHeader.indexOf("data-navigation-toggle"));
  assert.doesNotMatch(siteHeader, /<span>Menu<\/span>/);
  assert.doesNotMatch(layout, /footer-site-menu|Footer navigation|Browse portfolio sections/);
  assert.match(layout, /class="button button-secondary mt-3" href="\/privacy-policy\/"/);
});

test("Guide and Fit use proportional desktop width and responsive report grids", async () => {
  const fitForm = await readFile(new URL("../src/components/FitForm.astro", import.meta.url), "utf8");
  assert.match(slugPage, /const fluidPages = new Set\(\["the-guide", "check-fit"\]\)/);
  assert.match(slugPage, /fluid=\{fluidPages.has\(page.slug\)\}/);
  assert.match(layout, /fluid \? "interactive-page" : wide \? "max-w-\[96rem\]" : "max-w-6xl"/);
  const styles = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  assert.match(styles, /\.interactive-page\s*\{\s*width: 75%;/);
  assert.match(styles, /\.report-grid:not\(\[hidden\]\)\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(styles, /minmax\(min\(100%, 20rem\), 1fr\)/);
  for (const component of [guideForm, fitForm]) {
    assert.doesNotMatch(component, /max-w-/);
    assert.match(component, /<form class="mt-10 w-full min-w-0/);
    assert.match(component, /<section class="report-grid mt-10 w-full min-w-0/);
  }
});

test("Guide and Fit scroll to completed answers with reduced-motion support", async () => {
  const fitForm = await readFile(new URL("../src/components/FitForm.astro", import.meta.url), "utf8");
  for (const component of [guideForm, fitForm]) {
    assert.match(component, /class="report-grid [^"]*scroll-mt-6"/);
    assert.match(component, /results\.hidden = false;[\s\S]*results\.scrollIntoView\(\{/);
    assert.match(component, /behavior: window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches \? "instant" : "smooth"/);
    assert.match(component, /block: "start"/);
    assert.ok(component.indexOf("results.scrollIntoView") < component.indexOf("} catch (error)"));
  }
});

test("content cards share native mobile disclosures and breakpoint initialization", async () => {
  const card = await readFile(new URL("../src/components/ResponsiveCard.astro", import.meta.url), "utf8");
  const script = await readFile(new URL("../public/scripts/responsive-cards.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  assert.match(card, /<details .*data-responsive-card=\{alwaysCollapsible \? undefined : ""\}/);
  assert.match(card, /<summary>/);
  assert.match(card, /<slot \/>/);
  assert.match(script, /card\.open = desktopCards\.matches/);
  assert.match(script, /new MutationObserver\(initializeCards\)/);
  assert.match(layout, /src="\/scripts\/responsive-cards\.js" defer/);
  assert.match(styles, /\.site-header-inner\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) auto/s);
  assert.match(styles, /\.menu-toggle\s*\{[^}]*justify-self: center/s);
  assert.match(styles, /\.site-navigation-list \.nav-link\s*\{[^}]*font-size: 0\.875rem;[^}]*font-weight: 600/s);
});

test("expanded mobile navigation uses two centered columns with a centered final odd item", async () => {
  const styles = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  assert.match(styles, /@media \(max-width: 63\.999rem\)\s*\{\s*\.site-navigation-list\s*\{[^}]*display: grid;[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*justify-items: center;[^}]*text-align: center;/s);
  assert.match(styles, /\.site-navigation-list > li:last-child:nth-child\(odd\)\s*\{[^}]*grid-column: 1 \/ -1;/s);
});

test("education and certification institutions have local sourced logo assets", async () => {
  const institutions = JSON.parse(await readFile(new URL("institutions.json", contentDirectory), "utf8"));
  const names = new Set(institutions.map((item) => item.name));
  assert.equal(names.size, institutions.length);
  for (const record of [...profile.education, ...profile.certifications]) {
    assert.ok(names.has(record.institution), `Missing logo for ${record.name}`);
  }
  for (const institution of institutions) {
    assert.match(institution.logo, /^\/images\/institutions\/[^/]+\.(svg|png|jpg)$/);
    assert.equal(new URL(institution.source).protocol, "https:");
    const asset = await readFile(new URL(`../public${institution.logo}`, import.meta.url));
    if (institution.logo.endsWith(".svg")) {
      assert.match(asset.toString(), /<svg\b/);
      assert.doesNotMatch(asset.toString(), /<script\b|<foreignObject\b|<image\b|\bonload=/i);
    } else if (institution.logo.endsWith(".png")) {
      assert.equal(asset.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    } else {
      assert.equal(asset.subarray(0, 3).toString("hex"), "ffd8ff");
    }
  }
  const component = await readFile(new URL("../src/components/OrganizationLogo.astro", import.meta.url), "utf8");
  assert.match(component, /alt=\{`\$\{organization\} logo`\}/);
  assert.match(component, /throw new Error/);
  assert.match(slugPage, /<OrganizationLogo organization=\{item.institution\}/);
  assert.match(resumePage, /<OrganizationLogo organization=\{detail.institution\}/);
  const certifications = await readFile(new URL("../src/components/CertificationCards.astro", import.meta.url), "utf8");
  assert.match(certifications, /<OrganizationLogo organization=\{certification.institution\}/);
});

test("career history cards use sourced local employer logos on Experience and Resume views", async () => {
  const companies = JSON.parse(await readFile(new URL("companies.json", contentDirectory), "utf8"));
  const names = new Set(companies.map((item) => item.name));
  assert.equal(names.size, companies.length);
  for (const position of profile.experience.positions) {
    assert.ok(names.has(position.organization), `Missing employer logo for ${position.organization}`);
  }
  for (const company of companies) {
    assert.match(company.logo, /^\/images\/companies\/[^/]+\.(svg|png|jpg)$/);
    assert.equal(new URL(company.source).protocol, "https:");
    const asset = await readFile(new URL(`../public${company.logo}`, import.meta.url));
    if (company.logo.endsWith(".svg")) {
      assert.match(asset.toString(), /<svg\b/);
      assert.doesNotMatch(asset.toString(), /<script\b|<foreignObject\b|(?:href|src)="https?:/i);
    } else if (company.logo.endsWith(".png")) {
      assert.equal(asset.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    } else {
      assert.equal(asset.subarray(0, 3).toString("hex"), "ffd8ff");
    }
  }
  for (const page of [slugPage, resumePage]) {
    assert.match(page, /<OrganizationLogo organization=\{position.organization\}/);
  }
});

test("project and software skill cards share accessible technology banners", async () => {
  const banners = await readFile(new URL("../src/components/TechnologyBanners.astro", import.meta.url), "utf8");
  const project = await readFile(new URL("../src/components/ProjectCard.astro", import.meta.url), "utf8");
  assert.match(banners, /<ul class="technology-banners" aria-label=\{label\}>/);
  assert.match(banners, /alt=\{technology\}/);
  assert.match(banners, /<span class="technology-label">\{technology\}<\/span>/);
  assert.match(project, /<TechnologyBanners technologies=\{technologies\}/);
  assert.match(resumePage, /<TechnologyBanners technologies=\{project.technologies\}/);
  assert.match(resumePage, /<TechnologyBanners technologies=\{group.skills\}/);
});

test("README-style badges cover project technologies and embed available logos locally", async () => {
  const badges = JSON.parse(await readFile(new URL("technology-badges.json", contentDirectory), "utf8"));
  for (const technology of new Set(projects.flatMap((project) => project.technologies))) {
    assert.ok(badges[technology], `Missing badge for ${technology}`);
  }
  const badgeNames = new Set(Object.keys(badges).map((name) => name.toLowerCase()));
  for (const group of ["languages", "platformsAndFrameworks", "softwareEngineering", "data", "practices", "aiAndMachineLearning"]) {
    for (const skill of profile.skills[group]) {
      assert.ok(badgeNames.has(skill.toLowerCase()), `Missing ${group} badge for ${skill}`);
    }
  }
  for (const badge of Object.values(badges)) {
    const svg = await readFile(new URL(`../public/images/technologies/${badge.file}.svg`, import.meta.url), "utf8");
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\bonload=|(?:href|src)="https?:/i);
    if (badge.logo || badge.logoSource) assert.match(svg, /<image\b/);
  }
});

test("spoken language flags accompany proficiency text across Journey and Resume views", async () => {
  const component = await readFile(new URL("../src/components/SpokenLanguages.astro", import.meta.url), "utf8");
  assert.match(component, /language: "English", file: "us", country: "USA"/);
  assert.match(component, /language: "Spanish", file: "cr", country: "Costa Rica"/);
  assert.match(component, /<span>\{language\}<\/span>/);
  assert.match(slugPage, /<SpokenLanguages languages=\{profile.spokenLanguages\}/);
  assert.match(resumePage, /<SpokenLanguages languages=\{group.skills\}/);
  for (const country of ["us", "cr"]) {
    const flag = await readFile(new URL(`../public/images/flags/${country}.png`, import.meta.url));
    assert.equal(flag.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  }
});

test("privacy is exclusive to this site and distinguishes AI, Fit, and contact processing", () => {
  const policy = JSON.stringify(privacy);
  assert.doesNotMatch(policy, /unbound\s*root|sourceLink/i);
  assert.match(policy, /nicolas-figueroa\.me/);
  assert.match(policy, /Information submitted to the AI models is shared with OpenAI/);
  assert.match(policy, /shares it with OpenAI to classify requirements/);
  assert.match(policy, /Fit requires the AI service/);
  assert.doesNotMatch(policy, /does not send its submissions to OpenAI/);
  assert.match(policy, /Contact-form messages are not automatically sent to OpenAI/);
  assert.match(policy, /Netlify/);
});

test("evidence records have unique ids, local PDF routes, and mapped source files", () => {
  assert.equal(new Set(evidence.map((item) => item.id)).size, evidence.length);
  assert.ok(evidence.every((item) => item.file && item.fileName && item.title && item.knowledge));
  assert.ok(evidence.every((item) => item.supportedSkills));
  assert.ok(profile.education.every((item) =>
    item.evidenceIds.every((id) => evidence.some((record) => record.id === id)),
  ));
  assert.ok(profile.certifications.every((item) =>
    (item.evidenceIds || []).every((id) => evidence.some((record) => record.id === id)),
  ));
  assert.ok(profile.achievements.every((item) =>
    item.evidenceIds.every((id) => evidence.some((record) => record.id === id)),
  ));
});

test("network map uses neural layers and exposes the requested exploration links", () => {
  for (const title of ["Input layer", "Hidden layer 1", "Hidden layer 2", "Output layer"]) {
    assert.ok(networkMap.includes(title));
  }
  assert.match(networkMap, /label: "About", href: "\/about\/"/);
  assert.match(networkMap, /marker-end="url\(#network-arrow\)"/);
  assert.match(networkMap, /ReLU/);
  assert.match(networkMap, /sigmoid/);
  assert.doesNotMatch(networkMap, /data-network-toggle|A neural view of the portfolio|visibilitychange/);
  assert.ok(networkMap.indexOf('class="network-map-caption"') > networkMap.indexOf('class="network-map-diagram"'));
  for (const href of [
    "/journey/",
    "/experience/",
    "/resume/",
    "/projects/",
    "/media/",
    "/check-fit/",
    "/the-guide/",
    "/journey\/#education",
    "/journey\/#certificates",
  ]) {
    assert.ok(networkMap.includes(href), `Missing network destination ${href}`);
  }
});

test("presentation gallery references published PDF evidence", () => {
  const gallery = media.find((item) => item.type === "presentation-gallery");
  assert.ok(gallery);
  assert.ok(gallery.evidenceIds.length > 0);
  assert.ok(gallery.evidenceIds.every((id) =>
    evidence.some((record) => record.id === id && record.category === "Presentation"),
  ));
});

test("home focus areas omit Product Quality", () => {
  assert.ok(site.focusAreas.every((area) => !/product quality/i.test(area)));
});

test("home primary action leads to The Guide and second action leads to Journey", () => {
  assert.deepEqual(site.primaryAction, { label: "Ask the Guide", href: "/the-guide/" });
  assert.deepEqual(site.secondaryAction, { label: "Explore the journey", href: "/journey/" });
});

test("AI-generated Guide answers carry a cited-source accuracy disclaimer", () => {
  assert.match(guideForm, /AI-generated response:.*Confirm important claims with the cited source links/);
});

test("CSP permits same-origin function requests without inline scripts", () => {
  assert.match(netlifyConfig, /connect-src 'self';/);
  assert.match(siteHeader, /<script is:inline src="\/scripts\/theme-toggle\.js"><\/script>/);
});

test("resume views link to the Guide with a role-specific question prompt", () => {
  assert.match(guidePrompt, /Not finding what you're looking for\? Ask the Guide!/);
  assert.match(guidePrompt, /encodeURIComponent\(question\)/);
  assert.match(resumePage, /<GuidePrompt question=\{`What additional information is relevant to the \$\{view\.label\} perspective\?`\} \/>/);
  assert.match(slugPage, /<GuidePrompt question="What additional information should I explore in these resume views\?" \/>/);
  assert.match(resumePage, /the \$\{view\.label\} perspective/);
  assert.match(guideForm, /URLSearchParams\(window\.location\.search\)/);
});

test("navigation labels and destinations are unique", () => {
  assert.equal(new Set(navigation.map((item) => item.label)).size, navigation.length);
  assert.equal(new Set(navigation.map((item) => item.href)).size, navigation.length);
});

test("project names are unique and descriptions are present", () => {
  assert.equal(new Set(projects.map((project) => project.name)).size, projects.length);
  assert.ok(projects.every((project) => project.name && project.description && project.source));
  assert.ok(projects.every((project) => new URL(project.source).protocol === "https:"));
  assert.ok(projects.every((project) =>
    (project.productionLinks || []).every((link) =>
      link.label && new URL(link.url).protocol === "https:",
    ),
  ));
});

test("all supplied production deployments are linked from project cards", () => {
  const expectedUrls = [
    "https://intakewise.onrender.com",
    "https://intakewise-api.onrender.com",
    "https://nomadant-tech-api.onrender.com",
    "https://nomadant-tech.onrender.com",
    "https://restful-restaurants-backend-2ygw.onrender.com",
    "https://restful-restaurants-frontend-xjlj.onrender.com",
    "https://tara-hidalgo.netlify.app/",
    "https://nomadant-agentic-trip-planner.streamlit.app/",
  ];
  const productionUrls = new Set(
    projects.flatMap((project) => (project.productionLinks || []).map((link) => link.url)),
  );

  assert.ok(expectedUrls.every((url) => productionUrls.has(url)));
});

test("media content includes the requested YouTube channel", () => {
  assert.ok(media.some((item) =>
    item.url === "https://www.youtube.com/@Nomandantspointofview",
  ));
});

test("certifications have source links for resume views", () => {
  assert.ok(profile.certifications.every((item) =>
    item.name && new URL(item.source).protocol === "https:",
  ));
  assert.ok(profile.certifications.some((item) => item.credentialUrl));
  assert.ok(profile.experience.positions.some((item) =>
    item.title === "Safety, Quality and Regulatory Leader"
      && item.organization === "Philips",
  ));
  assert.ok(profile.spokenLanguages.some((language) => language.includes("Spanish")));
});

test("resume audience views are unique and every section has valid audiences", () => {
  const audienceSlugs = new Set(resume.views.map((view) => view.slug));
  const sectionIds = new Set(resume.sections.map((section) => section.id));
  const projectNames = new Set(projects.map((project) => project.name));
  const positionTitles = new Set(profile.experience.positions.map((position) => position.title));

  assert.equal(audienceSlugs.size, 4);
  assert.equal(sectionIds.size, resume.sections.length);
  assert.equal(new Set(resume.views.map((view) => view.summary)).size, resume.views.length);
  assert.equal(new Set(resume.views.map((view) => view.sectionOrder.join(","))).size, resume.views.length);
  for (const section of resume.sections) {
    assert.ok(section.audiences.every((audience) => audienceSlugs.has(audience)));
  }
  for (const view of resume.views) {
    assert.ok(view.sectionOrder.every((section) => sectionIds.has(section)));
    assert.ok(view.experienceTitles.every((title) => positionTitles.has(title)));
    for (const name of view.projectNames) {
      assert.ok(projectNames.has(name), `Unknown project "${name}" in ${view.slug} Resume view`);
    }
    assert.ok(view.sectionTitles.skills);
    assert.ok(view.sectionDescriptions.skills);
    assert.ok(view.skillGroups.every((group) =>
      group === "spokenLanguages" || Object.hasOwn(profile.skills, group),
    ));
  }
});

test("contact links use valid web or email destinations", () => {
  assert.ok(contact.every((item) =>
    item.label && ["https:", "mailto:"].includes(new URL(item.href).protocol),
  ));
});
