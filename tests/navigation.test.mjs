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
const profile = JSON.parse(await readFile(new URL("profile.json", contentDirectory), "utf8"));
const site = JSON.parse(await readFile(new URL("site.json", contentDirectory), "utf8"));
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
const slugPage = await readFile(new URL("../src/pages/[slug].astro", import.meta.url), "utf8");

test("navigation destinations have matching page content", () => {
  const pagePaths = new Set(pages.map((page) => `/${page.slug}/`));

  for (const item of navigation) {
    assert.ok(pagePaths.has(item.href), `Missing page content for ${item.href}`);
  }
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
    assert.ok(view.projectNames.every((name) => projectNames.has(name)));
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
