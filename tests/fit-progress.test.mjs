import assert from "node:assert/strict";
import test from "node:test";
import { FIT_PROGRESS_MESSAGES, startFitProgress } from "../src/scripts/fit-progress.mjs";

test("Fit progress has 20+ unique messages and advances every three seconds", (context) => {
  context.mock.timers.enable({ apis: ["setInterval"] });
  assert.ok(FIT_PROGRESS_MESSAGES.length >= 21);
  assert.equal(new Set(FIT_PROGRESS_MESSAGES).size, FIT_PROGRESS_MESSAGES.length);
  const messages = [];
  const stop = startFitProgress((message) => messages.push(message), "Starting assessment.");
  assert.deepEqual(messages, ["Starting assessment."]);
  context.mock.timers.tick(2999);
  assert.equal(messages.length, 1);
  context.mock.timers.tick(1);
  assert.equal(messages.at(-1), FIT_PROGRESS_MESSAGES[0]);
  for (let index = 1; index < FIT_PROGRESS_MESSAGES.length; index += 1) {
    context.mock.timers.tick(3000);
    assert.equal(messages.at(-1), FIT_PROGRESS_MESSAGES[index]);
  }
  context.mock.timers.tick(3000);
  assert.equal(messages.at(-1), FIT_PROGRESS_MESSAGES[0]);
  stop();
  const count = messages.length;
  context.mock.timers.tick(9000);
  assert.equal(messages.length, count);
  stop();
});
