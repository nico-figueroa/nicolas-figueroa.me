import assert from "node:assert/strict";
import test from "node:test";
import { readApiResponse } from "../src/scripts/api-response.mjs";

test("API response parser returns JSON payloads", async () => {
  const response = new Response(JSON.stringify({ answer: "Verified" }), {
    headers: { "content-type": "application/json" },
  });

  assert.deepEqual(await readApiResponse(response), { answer: "Verified" });
});

test("API response parser explains HTML responses without JSON parse errors", async () => {
  const response = new Response("<!doctype html><title>Not found</title>", {
    status: 404,
    headers: { "content-type": "text/html" },
  });

  await assert.rejects(
    () => readApiResponse(response),
    /Start the site with `npm run dev`/,
  );
});

test("API response parser reports JSON endpoint errors", async () => {
  const response = new Response(JSON.stringify({ error: "Try again." }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });

  await assert.rejects(() => readApiResponse(response), /Try again/);
});
