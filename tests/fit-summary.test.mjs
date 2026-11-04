import assert from "node:assert/strict";
import test from "node:test";
import { summarizeFit } from "../src/scripts/fit-summary.mjs";
import { analyzeFit } from "../src/server/fit.mjs";
import { readFile } from "node:fs/promises";

test("Fit summary counts audited gaps, separates partial matches, and preserves learning ranges", () => {
  const result = analyzeFit("Requirements:\nPython required.\nKubernetes required.\nDefense mission-planning experience required.\nExpert production-grade Docker required.");
  const summary = summarizeFit(result);
  assert.equal(summary.gapCount, result.requirements.filter((item) => item.status === "gap").length);
  assert.ok(result.requirements.some((item) => item.status === "partial"));
  for (const level of result.growthProjection.levels) {
    assert.ok(summary.learningTime.includes(`${level.label}: ${level.overall.time}`));
  }
  assert.match(summary.paragraph, /partially supported/);
  assert.match(summary.paragraph, /industry-domain experience/);
  assert.match(summary.paragraph, /not a hiring probability/);
});

test("Fit summary does not invent closure times for no extracted requirements or domain-only gaps", () => {
  const empty = summarizeFit(analyzeFit(""));
  assert.equal(empty.gapCount, 0);
  assert.match(empty.learningTime, /Not estimable/);
  assert.match(empty.paragraph, /do not establish fit/);
  const domainOnly = summarizeFit(analyzeFit("Requirements:\nDefense mission-planning experience required."));
  assert.equal(domainOnly.gapCount, 1);
  assert.match(domainOnly.learningTime, /Not estimable.*industry-domain/);
  const supported = summarizeFit(analyzeFit("Requirements:\nPython required."));
  assert.equal(supported.gapCount, 0);
  assert.equal(supported.learningTime, "No unsupported requirements to estimate");
});

test("Fit report begins with summary and keeps every detail section collapsible at every width", async () => {
  const form = await readFile(new URL("../src/components/FitForm.astro", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  assert.ok(form.indexOf("data-fit-summary>") < form.indexOf('<ResponsiveCard title="Score methodology'));
  assert.equal((form.match(/heading="h2" alwaysCollapsible/g) || []).length, 13);
  assert.doesNotMatch(form, /card.dataset.responsiveCard/);
  assert.match(form, /section.open = false/);
  assert.match(styles, /\.responsive-card:not\(\.report-section\)::details-content/);
  assert.match(styles, /\.responsive-card > summary \{\s*display: flex;/);
  assert.match(styles, /\.responsive-card:not\(\.report-section\) > summary \{\s*cursor: default;/);
  assert.match(form, /finally \{\s*stopProgress\(\);/);
  assert.match(form, /data-fit-spinner hidden aria-hidden="true"/);
  assert.match(form, /spinner\.hidden = false/);
  assert.match(form, /finally \{\s*stopProgress\(\);\s*if \(spinner instanceof HTMLElement\) spinner\.hidden = true;/);
  assert.match(styles, /animation: fit-spin 0\.8s linear infinite/);
  assert.match(styles, /prefers-reduced-motion: reduce\) \{\s*\.fit-spinner:not\(\[hidden\]\) \{\s*animation: none;/);
});
