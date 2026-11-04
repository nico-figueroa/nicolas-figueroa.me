import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { analyzeFitWithAI, fitSources, FitAnalysisError, jobPassages,
  validateClassification, validateModelAssessment } from "../src/server/fit-ai.mjs";
import { handleFitAnalysis } from "../functions/check-nicos-fit.mjs";
import { summarizeFit } from "../src/scripts/fit-summary.mjs";

const source = fitSources.find((item) => item.title === "Python");
const job = `About the job
Python required. Kubernetes preferred.
BS in any field required. Ability to make progress.
Defense industry experience required.
TCS Employee Benefits Summary
Discretionary Annual Incentive
Maternal & Parental Leaves
Commuter Benefits & Certification & Training Reimbursement
We do not evaluate AI proficiency by lines of generated code.`;

function item(key, label, category = "Technical skill", importance = "required", sourceText = label) {
  return { key, label, category, importance, sourceText, passageIds: ["passage-1"],
    reason: "Classified according to the statement's meaning." };
}

function classification() {
  return { items: [
    item("python", "Python"),
    item("kubernetes", "Kubernetes", "Technical skill", "preferred"),
    item("degree-level", "BS in any field", "Education"),
    item("delivery", "Ability to make progress", "Interpersonal and transferable capability"),
    item("defense", "Defense industry experience", "Industry domain"),
    ...["TCS Employee Benefits Summary", "Discretionary Annual Incentive", "Maternal & Parental Leaves",
      "Commuter Benefits & Certification & Training Reimbursement"].map((label, index) =>
      item(`benefit-${index}`, label, "Benefits and compensation", "informational")),
    item("commentary", "AI evaluation policy", "Employer commentary", "informational",
      "We do not evaluate AI proficiency by lines of generated code."),
    item("page-heading", "About the job", "Employer commentary", "informational"),
  ].map((entry) => ({ ...entry, passageIds: jobPassages(job)
    .filter((passage) => passage.text.includes(entry.sourceText)).map((passage) => passage.id) })) };
}

function passagePayload(classified, description = job) {
  return { passages: Object.fromEntries(jobPassages(description).map((passage) => [
    passage.id, classified.items.filter((entry) => entry.passageIds.includes(passage.id)),
  ])) };
}

function assessment() {
  const degree = fitSources.find((record) => record.title === "Master of Science in Information Management");
  const delivery = fitSources.find((record) => record.kind === "Documented achievement");
  return { summary: "Python and higher education are supported. Leadership outcomes support delivery; Kubernetes and defense-domain experience remain unestablished.",
    assessments: [
      { id: "requirement-2", matchType: "direct", confidence: 0.9, rationale: "Documented Python.",
        citations: [source.id] },
      { id: "requirement-3", matchType: "none", confidence: 0.8, rationale: "No evidence establishes Kubernetes.", citations: [] },
      { id: "requirement-4", matchType: "exceeds", confidence: 0.95, rationale: "Completed MS exceeds unrestricted BS minimum.",
        citations: [degree.id] },
      { id: "requirement-5", matchType: "equivalent", confidence: 0.8, rationale: "Documented delivery outcomes support making progress.",
        citations: [delivery.id] },
      { id: "requirement-6", matchType: "none", confidence: 0.8, rationale: "Defense industry experience is not documented.", citations: [] },
    ] };
}

function modelResponse(result, overrides = {}) {
  return Response.json({ status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(result) }] }],
    ...overrides });
}

function assessmentPayload(value) {
  return { ...value, assessments: Object.fromEntries(value.assessments.map(({ id, ...finding }) => [id, finding])) };
}

function mockedOptions(classified = classification(), assessed = assessment()) {
  const calls = [];
  return { calls, apiKey: "test-only", model: "gpt-4.1-mini",
    fetchImpl: async (url, init) => {
      const body = JSON.parse(init.body);
      calls.push({ url, body });
      return modelResponse(calls.length === 1
        ? passagePayload(classified, JSON.parse(body.input).jobDescription) : assessmentPayload(assessed));
    } };
}

test("LLM Fit scores only classified criteria and derives every report surface from validated findings", async () => {
  const options = mockedOptions();
  const result = await analyzeFitWithAI(job, options);
  assert.equal(result.assessmentMode, "llm-grounded");
  assert.equal(result.requirements.length, 5);
  assert.equal(result.excludedContent.length, 6);
  assert.equal(result.matchScore, 67); // (2 + 2 + 2) / (2 + 1 + 2 + 2 + 2)
  assert.deepEqual(result.relevantSkills, ["Python"]);
  assert.deepEqual(result.potentialGaps, ["Kubernetes"]);
  assert.equal(result.transferableCapabilities[0].matchType, "equivalent");
  assert.equal(result.domainGaps[0].label, "Defense industry experience");
  assert.equal(result.supportedRequirements.find((entry) => entry.label === "BS in any field").matchType, "exceeds");
  assert.equal(result.requirements[0].sources[0].quote, source.text);
  for (const level of result.growthProjection.levels) {
    assert.deepEqual(level.skills.map((skill) => skill.skill), ["Kubernetes"]);
  }
  assert.equal(options.calls.length, 2);
  const [classify, assess] = options.calls.map((call) => call.body);
  assert.equal(classify.text.format.type, "json_schema");
  assert.equal(classify.text.format.strict, true);
  const branches = classify.text.format.schema.$defs.item.anyOf;
  assert.equal(branches.length, 2);
  const scored = branches.find((branch) => branch.properties.importance.enum.includes("required"));
  const excluded = branches.find((branch) => branch.properties.importance.enum.includes("informational"));
  assert.deepEqual(scored.properties.importance.enum, ["required", "preferred"]);
  assert.deepEqual(excluded.properties.importance.enum, ["informational"]);
  assert.ok(scored.properties.category.enum.length > 0);
  assert.ok(excluded.properties.category.enum.length > 0);
  for (const category of scored.properties.category.enum) {
    assert.ok(!excluded.properties.category.enum.includes(category));
  }
  assert.equal(classify.store, false);
  assert.equal(assess.store, false);
  assert.equal(JSON.parse(classify.input).jobDescription, job);
  const assessmentInput = JSON.parse(assess.input);
  assert.equal(assessmentInput.requirements.length, 5);
  const schema = assess.text.format.schema.properties.assessments;
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, assessmentInput.requirements.map((entry) => entry.id));
  assert.deepEqual(Object.keys(schema.properties), schema.required);
  const [supportedSchema, gapSchema] = assess.text.format.schema.$defs.assessment.anyOf;
  assert.equal(supportedSchema.properties.citations.minItems, 1);
  assert.ok(!supportedSchema.properties.matchType.enum.includes("none"));
  assert.deepEqual(gapSchema.properties.matchType.enum, ["none"]);
  assert.equal(gapSchema.properties.citations.maxItems, 0);
  assert.ok(!JSON.stringify(assessmentInput.requirements).includes("Annual Incentive"));
  assert.ok(assessmentInput.sources.some((record) => record.kind === "Education"));
  assert.ok(assessmentInput.sources.some((record) => record.kind === "Deployed portfolio project"));
  assert.match(classify.instructions, /untrusted data/);
  assert.match(assess.instructions, /audit all conclusions/);
  assert.ok(result.validation.passed);
  const summary = summarizeFit(result);
  assert.equal(summary.gapCount, 2);
  assert.ok(summary.paragraph.endsWith(result.summary));
});

test("classification preserves benefits-administration work and genuine preferences, independent of headings", async () => {
  const description = "We value experience administering employee benefits. Python preferred.Benefits: parental leave.";
  const classified = { items: [
    item("benefits-administration", "Benefits administration", "Responsibility", "required",
      "We value experience administering employee benefits."),
    item("python", "Python", "Technical skill", "preferred"),
    item("leave", "Parental leave", "Benefits and compensation", "informational", "parental leave"),
  ] };
  const options = mockedOptions(classified, { summary: "Benefits-administration experience needs confirmation; Python is supported.",
    assessments: [
      { id: "requirement-1", matchType: "none", confidence: 0.8, rationale: "Benefits administration is not documented.", citations: [] },
      { id: "requirement-2", matchType: "direct", confidence: 0.9, rationale: "Python is documented.",
        citations: [source.id] },
    ] });
  const result = await analyzeFitWithAI(description, options);
  assert.equal(result.matchScore, 33);
  assert.ok(result.potentialGaps.includes("Benefits administration"));
  assert.deepEqual(result.growthProjection.levels[0].skills, []);
  assert.match(summarizeFit(result).learningTime, /Not estimable/);
});

test("classification rejects conflicting duplicates, invalid categories and missing passages", () => {
  for (const mutate of [
    (value) => { value.items.push({ ...value.items[0], category: "Education" }); },
    (value) => { value.items[0].category = "Unknown"; },
    (value) => { value.items[0].importance = "informational"; },
    (value) => { value.items[5].importance = "required"; },
    (value) => { value.items[0].key = ""; },
    (value) => { value.items.pop(); },
  ]) {
    const value = classification();
    mutate(value);
    assert.throws(() => validateClassification(passagePayload(value), job), FitAnalysisError);
  }
  const unknown = passagePayload(classification());
  unknown.passages.unknown = unknown.passages["passage-1"];
  assert.throws(() => validateClassification(unknown, job), FitAnalysisError);
});

test("classification source wording is attached by code, never generated by the model", () => {
  const description = "A novel capability is required; benefit details follow in the original passage.";
  const payload = { passages: { "passage-1": [item("capability", "A novel capability")] } };
  payload.passages["passage-1"][0].sourceText = "An invented quote that must never appear.";
  const result = validateClassification(payload, description);
  assert.equal(result[0].sourceText, description);
});

test("classification merges repeated requirements before assessment and retains required precedence", () => {
  const description = "Python preferred.\nPython required.";
  const payload = { passages: {
    "passage-1": [item("python", "Python", "Technical skill", "preferred", "Python preferred.")],
    "passage-2": [item("python", "Python", "Technical skill", "required", "Python required.")],
  } };
  const classified = validateClassification(payload, description);
  assert.equal(classified.length, 1);
  assert.equal(classified[0].importance, "required");
  assert.match(classified[0].sourceText, /Python preferred\.\nPython required\./);
  const lines = Array.from({ length: 161 }, (_value, index) => `Line ${index + 1}`);
  const passages = jobPassages(lines.join("\n"));
  assert.ok(passages.length <= 80);
  assert.equal(passages.map((passage) => passage.text).join("\n"), lines.join("\n"));
});

test("all categories enforce scoring eligibility independent of job wording", () => {
  const description = "A statement whose role is classified by the model.";
  const requiredCategories = [
    "Technical skill", "Engineering capability", "Interpersonal and transferable capability",
    "Education", "Experience duration", "Industry domain", "Professional credential",
    "Responsibility", "Other qualification",
  ];
  const excludedCategories = ["Benefits and compensation", "Employer commentary", "Application information"];
  for (const category of [...requiredCategories, ...excludedCategories]) {
    for (const importance of ["required", "preferred", "informational"]) {
      const payload = { passages: { "passage-1": [item("concept", description, category, importance)] } };
      const valid = excludedCategories.includes(category) === (importance === "informational");
      if (valid) assert.equal(validateClassification(payload, description).length, 1);
      else assert.throws(() => validateClassification(payload, description), FitAnalysisError);
    }
  }
});
test("adjacent evidence earns 35 percent rather than full or zero credit", async () => {
  const description = "Vue.js required. Python required.";
  const react = fitSources.find((record) => record.title === "React");
  const options = mockedOptions({ items: [item("vue", "Vue.js"), item("python", "Python")] },
    { summary: "React supports transferability to Vue, not documented Vue proficiency.",
      assessments: [
        { id: "requirement-1", matchType: "adjacent", confidence: 0.75,
          rationale: "Documented React experience is related frontend experience, not direct Vue evidence.",
          citations: [react.id] },
        { id: "requirement-2", matchType: "direct", confidence: 0.95,
          rationale: "Python is documented.", citations: [source.id] },
      ] });
  const result = await analyzeFitWithAI(description, options);
  assert.equal(result.matchScore, 68);
  assert.equal(result.requirements[0].result, "Partially Meets");
  assert.equal(result.partiallySupportedRequirements[0].label, "Vue.js");
  assert.deepEqual(result.potentialGaps, []);
});
test("assessment rejects missing/duplicate/unknown findings, hallucinated sources and contradictory evidence states", () => {
  const requirements = validateClassification(passagePayload(classification()), job)
    .filter((entry) => entry.importance !== "informational");
  for (const mutate of [
    (value) => { value.assessments.pop(); },
    (value) => { value.assessments[1].id = "requirement-1"; },
    (value) => { value.assessments[0].id = "unknown"; },
    (value) => { value.assessments[0].citations[0] = "invented"; },
    (value) => { value.assessments[0].citations[0] = { id: source.id, quote: "Fabricated Python experience" }; },
    (value) => { value.assessments[0].citations = []; },
    (value) => { value.assessments[0].matchType = "none"; },
    (value) => { value.assessments[0].confidence = 1.1; },
    (value) => { value.assessments[0].rationale = ""; },
  ]) {
    const value = assessment();
    mutate(value);
    assert.throws(() => validateModelAssessment(assessmentPayload(value), requirements), FitAnalysisError);
  }
});

test("punctuated concept keys are normalized without losing technology distinctions", () => {
  const description = "C++ required. C# required. Java / Spring Boot required.";
  const payload = { passages: { "passage-1": [
    item(" C++ ", "C++"), item("C#", "C#"),
    item(" Java / Spring Boot ", "Java / Spring Boot"),
  ] } };
  const classified = validateClassification(payload, description);
  assert.deepEqual(classified.map((entry) => entry.normalizedKey), ["c++", "c#", "java / spring boot"]);
  assert.deepEqual(classified.map((entry) => entry.id), ["requirement-1", "requirement-2", "requirement-3"]);
});

test("the complete pasted TCS description produces a report with all criteria assessed once", async () => {
  const description = await readFile(new URL("./fixtures/tcs-developer.txt", import.meta.url), "utf8");
  const calls = [];
  const response = await handleFitAnalysis(new Request("https://test.local/fit", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobDescription: description }),
  }), { ip: "fit-tcs-complete" }, {
    apiKey: "test-only",
    fetchImpl: async (_url, init) => {
      const request = JSON.parse(init.body);
      calls.push(request);
      const input = JSON.parse(request.input);
      if (request.text.format.name === "fit_classification") {
        return modelResponse({ passages: Object.fromEntries(input.passages.map((passage) => {
          const label = passage.text;
          const benefits = /incentive|coverage|leaves|insurance|commuter|time off|financial assistance|salary/i.test(label);
          const heading = /^(?:[*#]|-?\s*$)/.test(label);
          return [passage.id, [item(label.slice(0, 100), label.slice(0, 200),
            benefits ? "Benefits and compensation" : heading ? "Employer commentary" : "Engineering capability",
            benefits || heading ? "informational" : "required", label)]];
        })) });
      }
      return modelResponse({
        summary: "Documented experience provides related engineering evidence; exact technologies need confirmation.",
        assessments: Object.fromEntries(input.requirements.map((requirement) => [requirement.id, {
          matchType: "none", confidence: 0.8, rationale: "This fixture does not establish exact supporting evidence.", citations: [],
        }])),
      });
    },
  });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  assert.ok(result.requirements.length >= 10);
  assert.ok(result.excludedContent.length >= 8);
  assert.ok(!result.requirements.some((entry) => /salary|parental|reimbursement|insurance/i.test(entry.sourceText)));
  assert.equal(new Set(result.requirements.map((entry) => entry.id)).size, result.requirements.length);
  const requiredIds = calls[1].text.format.schema.properties.assessments.required;
  assert.deepEqual(requiredIds, result.requirements.map((entry) => entry.id));
});

test("AI errors produce explicit failures with no deterministic fallback or score", async () => {
  for (const [label, fetchImpl] of [
    ["unavailable", async () => new Response("", { status: 429 })],
    ["network", async () => { throw new TypeError("network disconnected"); }],
    ["incomplete", async () => modelResponse(classification(), { status: "incomplete" })],
    ["refusal", async () => Response.json({ status: "completed", output: [{ content: [{ type: "refusal" }] }] })],
    ["malformed", async () => Response.json({ status: "completed", output: [{ content: [{ type: "output_text", text: "not JSON" }] }] })],
    ["missing-passages", async () => modelResponse({ passages: {} })],
  ]) {
    const response = await handleFitAnalysis(new Request("https://test.local/fit", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobDescription: job }),
    }), { ip: `fit-ai-${label}` }, { apiKey: "test-only", fetchImpl });
    const payload = await response.json();
    assert.ok(response.status >= 500, label);
    assert.ok(payload.error, label);
    assert.equal(payload.matchScore, undefined, label);
  }
  await assert.rejects(() => analyzeFitWithAI(job, { apiKey: "" }),
    (error) => error instanceof FitAnalysisError && error.status === 503);
  await assert.rejects(() => analyzeFitWithAI(job, { apiKey: "invalid\nkey" }), FitAnalysisError);
});

test("benefits-only input stops before assessment and refuses to imply zero fit", async () => {
  const description = "Paid parental leave and annual incentive.";
  const options = mockedOptions({ items: [item("benefits", description, "Benefits and compensation", "informational")] });
  await assert.rejects(() => analyzeFitWithAI(description, options),
    (error) => error instanceof FitAnalysisError && error.status === 422);
  assert.equal(options.calls.length, 1);
});

test("uncited credentials, tenure, responsibilities and human gaps receive no technology timelines", async () => {
  const description = "Medical license required. Ten years in Kubernetes required. Excellent communication required.";
  const classified = { items: [
    item("license", "Medical license", "Professional credential"),
    item("tenure", "Ten years in Kubernetes", "Experience duration"),
    item("communication", "Excellent communication", "Interpersonal and transferable capability"),
  ] };
  const options = mockedOptions(classified, { summary: "Specialist qualifications need confirmation.",
    assessments: classified.items.map((_item, index) => ({
      id: `requirement-${index + 1}`, matchType: "none", confidence: 0.8,
      rationale: "Not established by the available documentation.", citations: [],
    })) });
  const result = await analyzeFitWithAI(description, options);
  assert.equal(result.matchScore, 0);
  assert.equal(summarizeFit(result).gapCount, 3);
  assert.match(summarizeFit(result).learningTime, /Not estimable/);
  assert.deepEqual(result.growthProjection.levels[0].skills, []);
});
