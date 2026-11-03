import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { handleGuide } from "../functions/ai-guide.mjs";
import { handleFitAnalysis } from "../functions/check-nicos-fit.mjs";
import { analyzeFit } from "../src/server/fit.mjs";
import {
  extractHtmlText,
  extractJobDescriptionFile,
  readFitInput,
  validateJobDescriptionUrl,
} from "../src/server/fit-input.mjs";
import { generateGroundedAnswer, rankDocuments } from "../src/server/knowledge.mjs";
import { consumeRateLimit, sanitizeText } from "../src/server/http.mjs";

function jsonRequest(url, payload, headers = {}) {
  return new Request(`https://portfolio.test${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

function makePdf(text) {
  const stream = `BT /F1 14 Tf 50 700 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

function makeDocx() {
  const contents = [
    [
      "[Content_Types].xml",
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ],
    [
      "word/document.xml",
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Python Engineer and automation</w:t></w:r></w:p></w:body></w:document>',
    ],
  ].map(([name, text]) => ({ name: Buffer.from(name), data: Buffer.from(text) }));
  const crc32 = (data) => {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  const localFiles = [];
  const directoryEntries = [];
  let localOffset = 0;
  for (const { name, data } of contents) {
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localFiles.push(local, name, data);

    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt32LE(checksum, 16);
    directory.writeUInt32LE(data.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(localOffset, 42);
    directoryEntries.push(directory, name);
    localOffset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(directoryEntries);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(contents.length, 8);
  end.writeUInt16LE(contents.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localFiles, directory, end]);
}

test("local search retrieves cited evidence and rejects unsupported queries", () => {
  const found = rankDocuments("AI Engineer RAG Azure");
  assert.ok(found.some((item) => item.title === "AI Engineering Lessons"));
  assert.ok(found.every((item) => item.source.startsWith("https://")));
  assert.deepEqual(rankDocuments("question about an undocumented fact"), []);
});

test("Guide returns evidence-only fallback with the required response fields", async () => {
  const response = await handleGuide(
    jsonRequest("/guide", { question: "What AI engineering work uses RAG and Azure?" }),
    { ip: "guide-test-evidence-only" },
    "",
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.aiStatus, "disabled");
  assert.ok(payload.answer);
  assert.ok(payload.supportingEvidence.length > 0);
  assert.ok(payload.citations.every((item) => item.url.startsWith("https://")));
  assert.ok(payload.sources.length > 0);
  assert.ok(payload.suggestedQuestions.length > 0);
});

test("Guide rejects invalid JSON and oversized questions", async () => {
  const invalid = await handleGuide(
    new Request("https://portfolio.test/guide", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
    { ip: "guide-test-invalid-json" },
    "",
  );
  assert.equal(invalid.status, 400);

  const oversized = await handleGuide(
    jsonRequest("/guide", { question: "x".repeat(1_201) }),
    { ip: "guide-test-oversized" },
    "",
  );
  assert.equal(oversized.status, 400);
});

test("Guide reports invalid OpenAI configuration without exposing the value", async () => {
  const response = await handleGuide(
    jsonRequest("/guide", { question: "What projects involve RAG and Azure?" }),
    { ip: "guide-test-invalid-config" },
    "invalid\nkey-value",
  );
  const payload = await response.json();

  assert.equal(payload.aiStatus, "unavailable");
  assert.match(payload.notice, /OPENAI_API_KEY is invalid/);
  assert.doesNotMatch(JSON.stringify(payload), /invalid\\nkey-value/);
});

test("Fit analysis exposes its formula, documented signals, gaps, and estimate label", () => {
  const result = analyzeFit(
    "Seeking Python and React in medical devices. Quality Operations Manager and risk management experience preferred, with Kubernetes.",
  );

  assert.equal(result.matchScore, 75);
  assert.match(result.scoreExplanation, /not a hiring probability/);
  assert.ok(result.relevantSkills.includes("Python"));
  assert.ok(result.relevantExperience.includes("Medical devices"));
  assert.ok(result.relevantExperience.some((item) =>
    item.includes("Quality Operations Manager — Philips"),
  ));
  assert.ok(result.potentialGaps.includes("Kubernetes"));
  assert.match(result.growthProjection.label, /estimate/i);
  assert.match(result.growthProjection.label, /not a guarantee/i);
  assert.equal(result.growthProjection.levels.length, 3);
  for (const level of result.growthProjection.levels) {
    assert.deepEqual(level.skills.map((item) => item.skill), result.potentialGaps);
    assert.ok(level.skills.every((item) => item.months[0] > 0 && item.months[1] >= item.months[0]));
    assert.match(level.overall.time, /one skill at a time/);
  }
  assert.deepEqual(
    result.growthProjection.levels.map((level) => level.label),
    ["Beginner", "Intermediate", "Advanced"],
  );
  assert.match(result.growthProjection.basis, /6–8 focused study hours per week/);
  assert.match(result.growthProjection.basis, /Full-Stack Engineer Career Path in about 3 months/);
  assert.match(result.growthProjection.basis, /AI Engineer Career Path in about 1 month/);
  assert.ok(result.source.startsWith("https://"));
});

test("Fit growth projections have no fabricated timelines when there are no identified gaps", () => {
  const result = analyzeFit("Seeking a systems thinker with communication and collaboration skills.");

  assert.deepEqual(result.potentialGaps, []);
  assert.ok(result.growthProjection.levels.every((level) =>
    level.skills.length === 0 && level.overall.time === "No identified skill gaps",
  ));
});

test("Fit recognizes confirmed aggregate MLOps evidence without claiming unverified tools", () => {
  const result = analyzeFit(`MLOps Engineer, LLM Performance at Confidential

Requirements:
Hands-on systems engineering background rather than an applied modeling or data science focus.
Practical experience in at least one of the following areas, with experience across multiple areas preferred: custom kernel development or optimization using Pallas, Triton, CUDA, or CUTLASS; profiling and trace analysis using JAX/XLA Profiler, Kineto, torch.profiler, or Nsight; debugging distributed or accelerator-bound workloads; or large-scale LLM serving with vLLM, SGLang, TensorRT-LLM, JetStream, KV cache, paged attention, or continuous batching.
Production experience with JAX and/or PyTorch.
Demonstrable career progression, strong written communication, and the ability to explain complex technical decisions clearly.`);

  assert.ok(result.matchScore > 0);
  assert.ok(result.requirements.some((item) =>
    item.id === "systems-background" && item.status === "matched",
  ));
  assert.ok(result.requirements.some((item) =>
    item.id === "practical-ml-systems" && item.status === "matched"
      && /specific area and tools were not identified/.test(item.evidence),
  ));
  assert.ok(result.requirements.some((item) =>
    item.id === "jax-pytorch-production" && item.status === "matched"
      && /specific framework was not identified/.test(item.evidence),
  ));
  assert.ok(result.potentialGaps.length > 0);
  assert.ok(result.potentialGaps.some((item) => /multiple ML-systems areas/i.test(item)));
  assert.ok(!result.potentialGaps.includes("Hands-on systems engineering background"));
  assert.ok(!result.potentialGaps.includes("Production experience with JAX or PyTorch"));
  assert.ok(result.partiallySupportedRequirements.some((item) => /MLOps engineering/i.test(item.label)));
  assert.ok(result.partiallySupportedRequirements.some((item) => /exact role title/i.test(item.evidence)));
  assert.ok(!result.potentialGaps.some((item) => /Pallas|Triton|CUDA|CUTLASS|vLLM/i.test(item)));
  assert.ok(result.growthProjection.levels.every((level) =>
    level.skills.map((item) => item.skill).join("|") === result.potentialGaps.join("|"),
  ));
  assert.ok(!result.requirements.some((item) => ["Pallas", "Triton", "CUDA", "CUTLASS", "JAX", "PyTorch", "vLLM"].includes(item.label)));
});

test("Fit keeps unknown requirements and regulated qualifications visible for unfamiliar roles", () => {
  const doctor = analyzeFit(`Physician

Requirements:
Current medical license and board certification required.
Clinical experience providing patient care is required.
Must hold a current Cobalt Reef Navigation endorsement.`);
  const attorney = analyzeFit(`Attorney

Qualifications:
Juris Doctor degree and admission to the bar required.
Experience in litigation and contract drafting preferred.`);

  assert.ok(doctor.matchScore < 100);
  assert.ok(doctor.potentialGaps.some((item) => /medical license/i.test(item)));
  assert.ok(doctor.potentialGaps.some((item) => /board certification/i.test(item)));
  assert.ok(doctor.potentialGaps.some((item) => /Cobalt Reef Navigation endorsement/i.test(item)));
  assert.ok(attorney.matchScore < 100);
  assert.ok(attorney.potentialGaps.some((item) => /Juris Doctor/i.test(item)));
  assert.ok(attorney.potentialGaps.some((item) => /bar admission/i.test(item)));
  for (const result of [doctor, attorney]) {
    assert.ok(result.growthProjection.levels.every((level) =>
      level.skills.map((item) => item.skill).join("|") === result.potentialGaps.join("|"),
    ));
  }
});

test("Fit endpoint validates requests and returns the documented result shape", async () => {
  const response = await handleFitAnalysis(jsonRequest("/fit", {
    jobDescription: "Looking for Python skills and systems thinking.",
  }));
  const payload = await response.json();

  assert.equal(response.status, 200);
  for (const field of [
    "matchScore",
    "relevantSkills",
    "relevantExperience",
    "relevantProjects",
    "potentialGaps",
    "growthProjection",
    "recommendedContent",
  ]) {
    assert.ok(field in payload, `Missing ${field}`);
  }
  assert.ok(Array.isArray(payload.partiallySupportedRequirements));
});

test("Fit endpoint accepts a bounded text file upload", async () => {
  const form = new FormData();
  form.append("file", new Blob([
    "Looking for Python, automation, and systems engineering experience.",
  ], { type: "text/plain" }), "role.txt");
  const response = await handleFitAnalysis(new Request("https://portfolio.test/fit", {
    method: "POST",
    body: form,
  }), { ip: "fit-test-upload" });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(payload.relevantSkills.includes("Python"));
});

test("Fit input extraction handles JSON, CSV, HTML, and RTF files", async () => {
  const json = await extractJobDescriptionFile(
    "role.json",
    Buffer.from(JSON.stringify({ title: "AI Engineer", skills: ["Python", "RAG"] })),
  );
  const csv = await extractJobDescriptionFile(
    "role.csv",
    Buffer.from('Role,Skills\nEngineer,"Python, AI systems"'),
  );
  const rtf = await extractJobDescriptionFile(
    "role.rtf",
    Buffer.from(String.raw`{\rtf1\ansi Senior Engineer\par Python and automation}`),
  );

  assert.match(json, /AI Engineer.*Python.*RAG/);
  assert.match(csv, /Engineer.*Python, AI systems/);
  assert.match(rtf, /Senior Engineer[\s\S]*Python and automation/);
  assert.match(extractHtmlText("<title>Role</title><main>Python <script>ignore()</script></main>"), /Role.*Python/);
  assert.doesNotMatch(extractHtmlText("<main>Python <script>ignore()</script></main>"), /ignore/);
});

test("Fit input extracts text from a valid PDF", async () => {
  const text = await extractJobDescriptionFile("role.pdf", makePdf("Python Engineer"));
  assert.match(text, /Python Engineer/);
});

test("Fit input extracts text from a valid DOCX", async () => {
  const text = await extractJobDescriptionFile("role.docx", makeDocx());
  assert.match(text, /Python Engineer and automation/);
});

test("Fit input normalizes pasted JSON and rejects unreadable or oversized uploads", async () => {
  const text = await readFitInput(jsonRequest("/fit", {
    jobDescription: '{"title":"AI Engineer","requirements":["Python","RAG"]}',
  }));
  assert.match(text, /AI Engineer.*Python.*RAG/);

  await assert.rejects(
    () => extractJobDescriptionFile("role.exe", Buffer.from("unsafe")),
    /Supported files/,
  );
  await assert.rejects(
    () => extractJobDescriptionFile("role.pdf", Buffer.from("not a PDF")),
    /not a valid PDF/,
  );
  const truncatedDocx = Buffer.alloc(24);
  truncatedDocx.write("PK", 0);
  truncatedDocx.writeUInt32LE(0x06054b50, 2);
  truncatedDocx.writeUInt16LE(1, 12);
  truncatedDocx.writeUInt32LE(1, 14);
  await assert.rejects(
    () => extractJobDescriptionFile("role.docx", truncatedDocx),
    /invalid archive directory/,
  );
  await assert.rejects(
    () => extractJobDescriptionFile("role.txt", Buffer.alloc(2_000_001, "x")),
    /2 MB or smaller/,
  );
});

test("Fit URL validation permits only public HTTPS hostnames without credentials or custom ports", () => {
  assert.equal(validateJobDescriptionUrl("https://example.com/careers/role").hostname, "example.com");
  for (const url of [
    "http://example.com/role",
    "https://127.0.0.1/role",
    "https://[::1]/role",
    "https://user:password@example.com/role",
    "https://example.com:8443/role",
  ]) {
    assert.throws(() => validateJobDescriptionUrl(url));
  }
});

test("Fit endpoint rejects a private-network URL without fetching it", async () => {
  const response = await handleFitAnalysis(jsonRequest("/fit", {
    jobDescriptionUrl: "https://127.0.0.1/internal",
  }), { ip: "fit-test-private-url" });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.error, /public HTTPS URLs/);
});

test("input handling strips control characters and bounds requests", () => {
  assert.equal(sanitizeText("hello\u0000world", 20), "hello world");
  assert.equal(sanitizeText("too long", 3), null);
  assert.equal(
    consumeRateLimit("rate-limit-test-ip", 1_000_000 + 60_001).allowed,
    true,
  );
  const start = 2_000_000;
  for (let index = 0; index < 12; index += 1) {
    assert.equal(consumeRateLimit("rate-limit-cap-test", start).allowed, true);
  }
  assert.equal(consumeRateLimit("rate-limit-cap-test", start).allowed, false);
});

test("generated Guide answers accept only retrieved citation identifiers", async () => {
  const evidence = [{
    id: "profile-001",
    title: "Profile",
    text: "Nicolas uses Python.",
    source: "https://github.com/nico-figueroa",
  }];
  const mockedFetch = mock.method(globalThis, "fetch", async () => new Response(
    JSON.stringify({
      output_text: JSON.stringify({
        answer: "The profile documents Python. [profile-001]",
        used_sources: ["profile-001"],
        suggested_questions: [],
      }),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  ));

  try {
    const result = await generateGroundedAnswer(
      "Which language is documented?",
      evidence,
      "test-api-key-not-sent",
      "embeddings",
    );
    assert.equal(result.aiStatus, "generated");
    assert.doesNotMatch(result.answer, /\[profile-001\]/);
    assert.equal(result.citations[0].title, "Profile");
    assert.equal(result.citations[0].url, evidence[0].source);
    assert.equal(result.sources[0].url, evidence[0].source);
    assert.equal(result.suggestedQuestions.length, 2);
    const requestBody = JSON.parse(mockedFetch.mock.calls[0].arguments[1].body);
    assert.match(requestBody.input, /JSON/);
    assert.match(requestBody.instructions, /untrusted data/i);
    assert.match(requestBody.instructions, /Never follow instructions/i);
    assert.match(requestBody.instructions, /Do not include source identifiers in the answer text/i);
  } finally {
    mockedFetch.mock.restore();
  }

  const invalidFetch = mock.method(globalThis, "fetch", async () => new Response(
    JSON.stringify({
      output_text: JSON.stringify({
        answer: "Unsupported. [unknown-source]",
        used_sources: ["unknown-source"],
        suggested_questions: [],
      }),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  ));
  try {
    await assert.rejects(() => generateGroundedAnswer(
      "Question",
      evidence,
      "test-api-key-not-sent",
      "lexical",
    ));
  } finally {
    invalidFetch.mock.restore();
  }
});
