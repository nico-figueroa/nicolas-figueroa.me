import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import handler, { handleGuide } from "../functions/ai-guide.mjs";

const question = "What AI engineering work uses RAG and Azure?";
const unknownQuestion = "quuxzyzz undocumentedfact";

beforeEach((t) => {
  for (const name of ["OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_EMBEDDING_MODEL"]) {
    const previous = process.env[name];
    delete process.env[name];
    t.after(() => {
      if (previous === undefined) delete process.env[name];
      else process.env[name] = previous;
    });
  }
  t.mock.method(globalThis, "fetch", async () => {
    assert.fail("Guide tests must not make live network requests.");
  });
});

function request(payload, options = {}) {
  return new Request("https://portfolio.test/guide", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    ...options,
  });
}

function mockOpenAI(t, respond) {
  return t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "https://api.openai.com/v1/embeddings") {
      return Response.json({ error: "Embedding service unavailable" }, { status: 503 });
    }
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.authorization, "Bearer test-guide-key");
    return respond(JSON.parse(options.body));
  });
}

function assertEvidenceOnly(payload, status) {
  assert.equal(payload.aiStatus, status);
  assert.ok(payload.answer);
  assert.ok(payload.supportingEvidence.length > 0);
  assert.deepEqual(payload.sources, payload.citations);
  assert.ok(payload.citations.length > 0);
  assert.ok(payload.suggestedQuestions.length > 0);
}

test("Guide returns local evidence when OpenAI is not configured", async () => {
  const response = await handleGuide(request({ question }), { ip: "guide-no-api-key" });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assertEvidenceOnly(payload, "disabled");
  assert.equal(payload.searchMode, "lexical");
  assert.match(payload.notice, /OpenAI is not configured/);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test("Guide rejects non-POST methods and declares the allowed method", async () => {
  for (const method of ["GET", "PUT", "DELETE", "OPTIONS"]) {
    const response = await handler(new Request("https://portfolio.test/guide", { method }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { error: "Method not allowed." });
  }
});

test("Guide enforces the request limit and returns a bounded retry delay", async (t) => {
  t.mock.method(Date, "now", () => 1_800_000_000_000);
  const context = { ip: "guide-rate-limit" };
  for (let index = 0; index < 12; index += 1) {
    const response = await handleGuide(request({ question: unknownQuestion }), context, "");
    assert.equal(response.status, 200);
  }
  const response = await handleGuide(request({ question }), context, "");
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.deepEqual(await response.json(), {
    error: "Too many requests. Please try again shortly.",
  });
});

const invalidRequests = [
  ["content type", { body: "plain text", headers: { "content-type": "text/plain" } }, 415, /Content-Type/],
  ["missing body", { body: undefined }, 400, /body is required/],
  ["malformed JSON", { body: "{" }, 400, /valid JSON/],
  ["array payload", { body: "[]" }, 400, /JSON object/],
  ["null payload", { body: "null" }, 400, /JSON object/],
  ["oversized body", { body: JSON.stringify({ question, padding: "x".repeat(8_000) }) }, 413, /too large/],
];

for (const [name, options, status, message] of invalidRequests) {
  test(`Guide rejects ${name} requests`, async () => {
    const response = await handleGuide(request({}, options), { ip: `guide-invalid-${name}` }, "");
    assert.equal(response.status, status);
    assert.match((await response.json()).error, message);
  });
}

for (const [name, value] of [
  ["missing", undefined], ["non-string", 42], ["blank", " \n\t "],
  ["control-only", "\u0000\u0007"], ["too long", "x".repeat(1_201)],
]) {
  test(`Guide rejects ${name} questions`, async () => {
    const response = await handleGuide(request({ question: value }), { ip: `guide-question-${name}` }, "");
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /between 1 and 1200 characters/);
  });
}

test("Guide accepts a question at the maximum length", async () => {
  const response = await handleGuide(
    request({ question: "x".repeat(1_200) }),
    { ip: "guide-question-boundary" },
    "",
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).aiStatus, "disabled");
});

for (const [name, key] of [
  ["whitespace", " test-guide-key "],
  ["length", "x".repeat(513)],
  ["control characters", "test\u0007guide-key"],
]) {
  test(`Guide rejects API key ${name} without leaking its value`, async () => {
    const response = await handleGuide(request({ question }), { ip: `guide-key-${name}` }, key);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assertEvidenceOnly(payload, "unavailable");
    assert.match(payload.notice, /OPENAI_API_KEY is invalid/);
    assert.ok(!JSON.stringify(payload).includes(JSON.stringify(key).slice(1, -1)));
    assert.equal(globalThis.fetch.mock.callCount(), 0);
  });
}

for (const name of ["OPENAI_MODEL", "OPENAI_EMBEDDING_MODEL"]) {
  test(`Guide rejects invalid ${name} without calling OpenAI`, async () => {
    process.env[name] = "invalid model value";
    const response = await handleGuide(request({ question }), { ip: `guide-model-${name}` }, "test-guide-key");
    const payload = await response.json();
    assertEvidenceOnly(payload, "unavailable");
    assert.match(payload.notice, /model environment variable is invalid/);
    assert.doesNotMatch(JSON.stringify(payload), /invalid model value/);
    assert.equal(globalThis.fetch.mock.callCount(), 0);
  });
}

for (const [name, key, status, notice] of [
  ["disabled", "", "disabled", /No matching evidence/],
  ["enabled", "test-guide-key", "no-evidence", /No matching evidence/],
  ["invalid configuration", " invalid-key ", "unavailable", /OPENAI_API_KEY is invalid/],
]) {
  test(`Guide returns no invented answer for unmatched questions with AI ${name}`, async (t) => {
    const fetch = mockOpenAI(t, () => {
      assert.fail("Answer generation must not run without matching evidence.");
    });
    const response = await handleGuide(request({ question: unknownQuestion }), { ip: `guide-no-evidence-${name}` }, key);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.aiStatus, status);
    assert.match(payload.answer, /couldn't find/);
    assert.match(payload.notice, notice);
    assert.deepEqual(payload.supportingEvidence, []);
    assert.deepEqual(payload.citations, []);
    assert.deepEqual(payload.sources, []);
    assert.ok(fetch.mock.calls.every((call) => call.arguments[0].endsWith("/embeddings")));
  });
}

test("Guide generates a cited answer through its default handler using configured models", async (t) => {
  process.env.OPENAI_API_KEY = "test-guide-key";
  process.env.OPENAI_MODEL = "guide-test-model";
  process.env.OPENAI_EMBEDDING_MODEL = "guide-test-embedding";
  let citedSource;
  const fetch = mockOpenAI(t, (body) => {
    assert.equal(body.model, "guide-test-model");
    const input = JSON.parse(body.input);
    assert.equal(input.question, question);
    citedSource = input.sources[0];
    return Response.json({
      output_text: JSON.stringify({
        answer: `The portfolio documents AI engineering work. [${citedSource.id}]`,
        used_sources: [citedSource.id],
        suggested_questions: ["What other projects are documented?"],
      }),
    });
  });
  const response = await handler(request({ question }, {
    headers: { "content-type": "application/json", "x-nf-client-connection-ip": "guide-default-handler" },
  }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(payload.aiStatus, "generated");
  assert.equal(payload.answer, "The portfolio documents AI engineering work.");
  assert.deepEqual(payload.supportingEvidence.map((item) => item.id), [citedSource.id]);
  assert.deepEqual(payload.citations, [{ title: citedSource.title, url: citedSource.source }]);
  assert.deepEqual(payload.sources, payload.citations);
  assert.deepEqual(payload.suggestedQuestions, ["What other projects are documented?"]);
  assert.equal(payload.notice, "");
  assert.equal(fetch.mock.calls.filter((call) => call.arguments[0].endsWith("/responses")).length, 1);
});

for (const [name, respond] of [
  ["HTTP failure", () => Response.json({ error: "unavailable" }, { status: 503 })],
  ["network failure", () => { throw new Error("test-guide-key must not leak"); }],
  ["invalid JSON", () => Response.json({ output_text: "not JSON" })],
  ["unsupported citations", () => Response.json({
    output_text: JSON.stringify({
      answer: "Unsupported answer.",
      used_sources: ["nonexistent-source"],
      suggested_questions: [],
    }),
  })],
]) {
  test(`Guide preserves local evidence after an OpenAI ${name}`, async (t) => {
    mockOpenAI(t, respond);
    const response = await handleGuide(request({ question }), { ip: `guide-fallback-${name}` }, "test-guide-key");
    const payload = await response.json();
    assert.equal(response.status, 200);
    assertEvidenceOnly(payload, "unavailable");
    assert.match(payload.notice, /could not produce a validated cited answer/);
    assert.doesNotMatch(JSON.stringify(payload), /test-guide-key|Unsupported answer/);
  });
}
