import assert from "node:assert/strict";
import test from "node:test";
import { startNetworkTraining } from "../src/scripts/network-training.mjs";

test("training alternates direction, changes bounded weights during backpropagation, and stops cleanly", (context) => {
  context.mock.timers.enable({ apis: ["setInterval"] });
  const states = [];
  let random = 1;
  const stop = startNetworkTraining(19, (state) => states.push(state), () => random);
  assert.equal(states[0].phase, "forward");
  assert.ok(states[0].weights.every((weight) => weight === 0.5));
  for (let step = 1; step <= 3; step += 1) {
    context.mock.timers.tick(1500);
    assert.equal(states.at(-1).phase, "forward");
    assert.deepEqual(states.at(-1).weights, states[0].weights);
  }
  context.mock.timers.tick(1500);
  assert.equal(states.at(-1).phase, "backward");
  assert.ok(states.at(-1).weights.every((weight) => weight === 0.75));
  for (let step = 0; step < 3; step += 1) context.mock.timers.tick(1500);
  assert.ok(states.at(-1).weights.every((weight) => weight === 0.95));
  context.mock.timers.tick(1500);
  assert.equal(states.at(-1).phase, "forward");
  random = 0;
  for (let step = 0; step < 7; step += 1) context.mock.timers.tick(1500);
  assert.ok(states.at(-1).weights.every((weight) => weight === 0.15));
  const count = states.length;
  stop();
  context.mock.timers.tick(12000);
  assert.equal(states.length, count);
});
