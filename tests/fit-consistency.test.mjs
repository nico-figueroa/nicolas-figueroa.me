import assert from "node:assert/strict";
import test from "node:test";
import { analyzeFit } from "../src/server/fit.mjs";
import {
  assessDuration,
  normalizeCapabilities,
  validateAssessment,
} from "../src/server/fit-requirements.mjs";

function assertConsistent(result) {
  assert.equal(result.validation.passed, true);
  assert.equal(new Set(result.requirements.map((item) => item.normalizedKey)).size, result.requirements.length);
  const allowedResults = ["Exceeds", "Meets", "Partially Meets", "Gap"];
  for (const requirement of result.requirements) {
    assert.ok(allowedResults.includes(requirement.result), requirement.label);
    assert.ok(requirement.evidence.trim(), requirement.label);
    assert.ok(requirement.confidence >= 0 && requirement.confidence <= 1, requirement.label);
    if (["DIRECT", "EQUIVALENT", "EXCEEDS"].includes(requirement.evidenceType)) {
      assert.equal(requirement.status, "matched", requirement.label);
      assert.ok(!result.potentialGaps.includes(requirement.label), requirement.label);
      assert.ok(!result.domainGaps.some((item) => item.label === requirement.label), requirement.label);
      assert.ok(requirement.sources.length, requirement.label);
    }
  }
  const denominator = result.requirements.reduce((sum, item) => sum + item.weight, 0);
  const numerator = result.requirements.reduce((sum, item) =>
    sum + item.weight * (item.status === "matched" ? 1 : item.status === "partial" ? 0.35 : 0), 0);
  assert.equal(result.matchScore, denominator ? Math.round(100 * numerator / denominator) : 0);
}

test("Fit decomposes lifecycle responsibilities and separates defense domain from capability", () => {
  const result = analyzeFit(`Software Engineer
Requirements:
BS degree required.
5 years of professional experience required.
Contribute to design, development, testing, integration and maintenance of weapon-planning software.`);
  for (const label of ["Software design", "Software development", "Software testing", "System integration", "Software maintenance"]) {
    const requirement = result.requirements.find((item) => item.label === label);
    assert.equal(requirement?.result, "Meets", label);
    assert.ok(requirement.sources.length, label);
  }
  assert.ok(result.requirements.some((item) => item.category === "Education" && item.result === "Exceeds"));
  assert.ok(result.requirements.some((item) => item.category === "Experience duration" && item.result === "Exceeds"));
  assert.equal(result.domainGaps.length, 1);
  assert.match(result.domainGaps[0].label, /Defense/);
  assert.ok(!result.potentialGaps.some((item) => /defense|weapon|software|design|development|testing|integration|maintenance/i.test(item)));
  assert.ok(!result.growthProjection.levels.some((level) =>
    level.skills.some((item) => /defense|weapon/i.test(item.skill)),
  ));
  assertConsistent(result);
});

test("Fit uses documented semantic mappings, projects, coursework, and technical documents", () => {
  const result = analyzeFit(`Requirements:
Software architecture required.
Translate stakeholder requirements and feature planning into software.
API integration, backend/frontend integration, database integration required.
Design, implementation, testing, deployment and maintenance required.
Troubleshooting, root cause analysis, defect resolution and issue investigation required.
Secure coding, authentication, authorization, secrets management, API security and HTTPS required.
Docker container workflows required.
CI/CD and automated builds required.
Modular design, separation of concerns and layered architecture required.`);
  for (const key of [
    "software-architecture", "requirements-analysis", "system-integration", "software-development",
    "software-testing", "software-deployment", "software-maintenance", "debugging", "cybersecurity",
    "containerization", "build-pipelines", "architecture-principles",
  ]) {
    const requirement = result.requirements.find((item) => item.normalizedKey === `capability-${key}`);
    assert.equal(requirement?.status, "matched", key);
    assert.ok(requirement.sources.length, key);
  }
  const sources = result.requirements.flatMap((item) => item.sources);
  assert.ok(sources.some((source) => /Deployed portfolio project/.test(source.kind)));
  assert.ok(sources.some((source) => /documentation/.test(source.kind)));
  assert.ok(sources.some((source) => /academic/.test(source.kind)));
  assertConsistent(result);
});

test("Fit does not manufacture evidence when capability records are absent", () => {
  const requirements = normalizeCapabilities([
    "Software architecture, testing, Docker, API integration, cybersecurity, automated builds and design patterns required.",
  ], []);
  assert.ok(requirements.length >= 7);
  for (const requirement of requirements) {
    assert.equal(requirement.status, "gap");
    assert.equal(requirement.sources.length, 0);
  }
});

test("Fit excludes benefit sections from every matching and evidence extraction path", () => {
  const baseline = analyzeFit("Software Engineer\nRequirements:\nPython required.");
  for (const heading of ["Benefits", "Compensation and benefits", "What we offer", "## Benefits and perks"]) {
    const result = analyzeFit(`Software Engineer\nRequirements:\nPython required.\n${heading}\nKubernetes experience provides access to our training benefit.\nHealth insurance and dental coverage.\nTeam leadership development and AWS certification reimbursement.\n    Required qualifications:\nReact required.`);
    const expected = analyzeFit("Software Engineer\nRequirements:\nPython required.\nReact required.");
    assert.deepEqual(result.requirements, expected.requirements, heading);
    assert.deepEqual(result.relevantProjects, expected.relevantProjects, heading);
    assertConsistent(result);
  }
  const unheaded = analyzeFit("Software Engineer\nPython required.\nWe offer Kubernetes training and AWS certification reimbursement.\nPaid time off and health insurance.\n401(k) matching.");
  assert.deepEqual(unheaded.requirements, baseline.requirements);
  assert.equal(unheaded.matchScore, baseline.matchScore);
  const insuranceRole = analyzeFit("Requirements:\nExperience in health insurance administration required.\nBenefits administration experience required.");
  assert.ok(insuranceRole.potentialGaps.some((item) => /health insurance/i.test(item)));
  assert.ok(insuranceRole.potentialGaps.some((item) => /Benefits administration/i.test(item)));
});

test("Fit credits transferable human skills from documented responsibilities and outcomes", () => {
  const result = analyzeFit(`Requirements:
Strong communication and interpersonal skills and the ability to make progress.
Teamwork, problem-solving, leadership and adaptability required.`);
  for (const key of ["delivery", "communication", "collaboration", "problem-solving", "leadership", "adaptability"]) {
    const requirement = result.requirements.find((item) => item.normalizedKey === `human-${key}`);
    assert.equal(requirement?.result, "Meets", key);
    assert.equal(requirement?.evidenceType, "EQUIVALENT", key);
    assert.ok(requirement.sources.length, key);
    assert.match(requirement.evidence, /inference/);
  }
  assert.equal(result.potentialGaps.length, 0);
  assertConsistent(result);
  const absent = normalizeCapabilities(["Communication skills and the ability to make progress required."], []);
  assert.ok(absent.length >= 2);
  assert.ok(absent.every((item) => item.status === "gap"));
  const specialist = analyzeFit("Requirements:\nClinical therapy communication skills required.");
  assert.ok(specialist.requirements.some((item) => item.normalizedKey === "human-communication-specialized" && item.status === "partial"));
  const compound = analyzeFit("Requirements:\nCommunication skills and current Cobalt Reef Navigation endorsement required.");
  assert.ok(compound.potentialGaps.some((item) => /Cobalt Reef Navigation/.test(item)));
});

test("Fit rejects inline benefits, page labels, and evaluation commentary from pasted job text", () => {
  const result = analyzeFit(`About the job
Requirements: JavaScript and TypeScript experience.React experience required.
Strong communication skills and the ability to make progress.
We value demonstrated contribution and Java experience.
We do not evaluate AI proficiency by lines of generated code or by the percentage of code written by a tool.
Benefits: stock options and Kubernetes training.
Preferred qualifications: Python required.`);
  assert.ok(!result.requirements.some((item) =>
    /About the job|Benefits:|stock options|We value|We do not evaluate/i.test(`${item.label} ${item.sourceText}`)));
  assert.ok(!result.requirements.some((item) => item.label === "Java" || item.label === "Kubernetes"));
  for (const skill of ["JavaScript", "TypeScript", "React", "Python"]) {
    assert.ok(result.requirements.some((item) => item.label === skill), skill);
  }
  assert.ok(!result.relevantSkills.some((item) => /progress|communication/i.test(item)));
  assert.equal(result.transferableCapabilities.length, 2);
  assertConsistent(result);
  const compact = analyzeFit("About the job\nJavaScript experience.Benefits: stock options.Qualifications: React required.");
  assert.ok(!compact.requirements.some((item) => /benefits|stock options|About the job/i.test(item.label)));
  assert.ok(compact.requirements.some((item) => item.label === "React"));
});

test("Fit normalizes repeated synonymous capabilities without duplicate scoring", () => {
  const aliases = analyzeFit("Requirements:\nNode.js and NodeJS required. React and React.js required.");
  assert.equal(aliases.requirements.length, 2);
  assert.ok(aliases.requirements.every((item) => item.result === "Meets"));
  assertConsistent(aliases);
  const principles = analyzeFit("Requirements:\nDesign patterns required.");
  assert.equal(principles.requirements.length, 1);
  assert.equal(principles.requirements[0].normalizedKey, "capability-architecture-principles");
  const result = analyzeFit(`Requirements:
Docker required.
Containerization required.
Software architecture required.
System architecture required.
Solution architecture required.
BS degree required.
Bachelor's degree required.
5 years of professional experience required.
At least 5 years experience required.`);
  assert.equal(result.requirements.filter((item) => item.normalizedKey === "capability-containerization").length, 1);
  assert.equal(result.requirements.filter((item) => item.normalizedKey === "capability-software-architecture").length, 1);
  assert.equal(result.requirements.filter((item) => item.category === "Education").length, 1);
  assert.equal(result.requirements.filter((item) => item.category === "Experience duration").length, 1);
  assertConsistent(result);
});

test("Fit experience duration credits seniority but does not invent specialist years", () => {
  assert.equal(assessDuration("5 years of professional experience required").matchType, "exceeds");
  assert.equal(assessDuration("17 years of experience required").status, "matched");
  assert.equal(assessDuration("50 years of professional experience required").status, "partial");
  assert.equal(assessDuration("10 years of Kubernetes experience required").status, "gap");
  assert.match(assessDuration("5 years of professional experience required").evidence, /merging overlapping/);
  const result = analyzeFit(`Requirements:
17 years of professional experience required.
5 years of experience required.
10 years of Kubernetes experience required.`);
  assertConsistent(result);
});

test("Fit retains unknown requirements in compound clauses instead of hiding them behind known skills", () => {
  for (const capability of ["Python", "Software architecture"]) {
    const result = analyzeFit(`Requirements:\n${capability} and current Cobalt Reef Navigation endorsement required.`);
    assert.ok(result.potentialGaps.some((item) => /Cobalt Reef Navigation/.test(item)), capability);
    assert.ok(result.requirements.some((item) => item.status === "matched"), capability);
    assertConsistent(result);
  }
});

test("Fit does not promote basic or academic evidence to expert specialist qualifications", () => {
  const result = analyzeFit(`Requirements:
Expert production-grade Docker containerization required.
Advanced zero-trust cybersecurity required.`);
  assert.ok(result.requirements.some((item) => /container/i.test(item.label) && item.result === "Partially Meets"));
  assert.ok(result.requirements.some((item) => /security/i.test(item.label) && item.result === "Partially Meets"));
  assert.ok(!result.requirements.some((item) => item.status === "matched"));
  assertConsistent(result);
});

test("final Fit audit resolves conflicting duplicate conclusions and rejects invalid evidence states", () => {
  const base = {
    id: "one", normalizedKey: "same-capability", label: "Testing", category: "Engineering capability",
    sourceText: "testing", weight: 1, status: "gap", matchType: "none", evidence: "No evidence", sources: [],
  };
  const requirements = validateAssessment([
    base,
    { ...base, id: "two", status: "matched", matchType: "equivalent", evidence: "Documented testing project" },
    { ...base, id: "three", status: "matched", matchType: "exceeds", evidence: "Broader documented evidence" },
  ]);
  assert.equal(requirements.length, 1);
  assert.equal(requirements[0].result, "Exceeds");
  assert.equal(requirements[0].status, "matched");
  assert.throws(() => validateAssessment([{ ...base, status: "gap", matchType: "exceeds" }]), /inconsistent/);
  assert.throws(() => validateAssessment([{ ...base, status: "matched", matchType: "direct", evidence: "" }]), /no supporting/);
});
