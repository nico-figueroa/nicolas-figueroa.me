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
