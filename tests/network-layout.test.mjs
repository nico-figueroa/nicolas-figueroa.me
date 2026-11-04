import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("network diagram uses container-scaled geometry without internal scrollbars", async () => {
  const styles = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  assert.match(styles, /\.network-map-scroll \{\s*overflow: visible;/);
  assert.match(styles, /\.network-map-diagram \{[^}]*width: 100%;[^}]*height: clamp\(24rem, 42cqw, 35rem\);/);
  assert.match(styles, /\.home-hero h1 \{\s*font-size: clamp/);
  assert.match(styles, /\.network-map-node \{[^}]*width: 80%;[^}]*min-height: 2\.75rem;/);
  assert.match(styles, /height: clamp\(36rem, 85svh, 45rem\);/);
  assert.match(styles, /\.network-map-layer \{\s*top: 2\.5rem;/);
  assert.match(styles, /\.network-map-layer-heading \{\s*position: absolute;\s*top: -2\.5rem;/);
  assert.match(styles, /\.network-map-lines-desktop \{\s*top: 2\.5rem;\s*height: calc\(100% - 2\.5rem\);/);
});

test("network geometry is stylesheet-owned for the production Content Security Policy", async () => {
  const component = await readFile(new URL("../src/components/NetworkMap.astro", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  const config = await readFile(new URL("../astro.config.mjs", import.meta.url), "utf8");
  assert.match(config, /assetsInlineLimit: 0/);
  assert.doesNotMatch(component, /\sstyle=/);
  assert.match(component, /data-layer-index=\{index\}/);
  assert.match(component, /data-node-y=\{node\.y\}/);
  assert.match(component, /data-node-index=\{nodeIndex\}/);
  assert.match(component, /data-node-count=\{layer\.nodes\.length\}/);
  for (const index of [0, 1, 2, 3]) {
    assert.ok(styles.includes(`.network-map-layer[data-layer-index="${index}"] { --layer-index: ${index}; }`));
  }
  for (const y of [160, 230, 300, 370, 440]) {
    assert.ok(styles.includes(`.network-map-node[data-node-y="${y}"] { --node-y: calc(${y} / 560 * 100%); }`));
  }
  for (const index of [0, 1, 2]) {
    assert.ok(styles.includes(`.network-map-node[data-node-index="${index}"] { --mobile-node-x:`));
  }
  for (const index of [0, 1]) {
    assert.ok(styles.includes(`.network-map-layer[data-node-count="2"] [data-node-index="${index}"]`));
  }
});
