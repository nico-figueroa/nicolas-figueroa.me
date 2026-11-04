import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("footer platforms have local logos, including Outlook for email", async () => {
  const contact = JSON.parse(await readFile(new URL("../src/content/contact.json", import.meta.url), "utf8"));
  assert.deepEqual(contact.map((item) => item.icon), ["github", "linkedin", "codecademy", "handshake", "microsoftoutlook"]);
  for (const item of contact) {
    const svg = await readFile(new URL(`../public/images/platforms/${item.icon}.svg`, import.meta.url), "utf8");
    assert.match(svg, /<svg/);
    assert.match(svg, /<path/);
  }
  const layout = await readFile(new URL("../src/layouts/SiteLayout.astro", import.meta.url), "utf8");
  assert.match(layout, /item\.icon/);
  assert.equal((layout.match(/class="footer-icon"/g) || []).length, 3);
  assert.equal((layout.match(/aria-hidden="true"/g) || []).length, 3);
  assert.equal((layout.match(/focusable="false"/g) || []).length, 2);
});
