/* Rebuild wifi/oui.txt (device makers by MAC prefix) from the IEEE list.

   The IEEE list comes from the oui-data npm package:
     npm pack oui-data && tar xzf oui-data-*.tgz
     node wifi/tools/build-oui.mjs package/index.json

   Output: one maker per line, "Maker name|PREFIXPREFIX…" (6-hex prefixes
   run together), only the 6-digit (MA-L) blocks that consumer gear uses.
   About 560 KB, or 280 KB gzipped as GitHub Pages serves it. The page only
   downloads it when someone looks at their device list. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src) {
  console.error('usage: node build-oui.mjs <path to oui-data index.json>');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(src, 'utf8'));

// Strip the legal bits ("Inc.", "Co., Ltd") so names read like brands,
// but keep words such as "Electronics" that tell makers apart.
const LEGAL = /[\s,.]*\b(incorporated|inc|corporation|corp|co|ltd|limited|llc|l\.l\.c|gmbh|ag|s\.?a|s\.?p\.?a|b\.?v|plc|pty|pte|kk|k\.k|oy|ab|srl|sas|nv|company)\b\.?/gi;
const clean = (raw) => {
  let s = raw.split('\n')[0].trim();
  s = s.replace(LEGAL, '').replace(/[\s,.]+$/, '').replace(/\s{2,}/g, ' ').replace(/[|]/g, ' ').trim();
  return s || 'Unknown';
};

const byName = new Map();
for (const [prefix, v] of Object.entries(data)) {
  if (prefix.length !== 6) continue;
  const name = clean(v);
  if (!byName.has(name)) byName.set(name, []);
  byName.get(name).push(prefix.toUpperCase());
}
const out = [...byName].map(([name, prefixes]) => name + '|' + prefixes.sort().join('')).sort().join('\n') + '\n';
const dest = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'oui.txt');
fs.writeFileSync(dest, out);
console.log(`wrote ${dest}: ${byName.size} makers, ${(out.length / 1024).toFixed(0)} KB`);
