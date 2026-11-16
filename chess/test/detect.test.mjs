// Board detection accuracy on fake screenshots: node detect.test.mjs <fixtures_dir> [model.bin]
import fs from 'fs';
import path from 'path';
import { detectBoard, warpBoard, loadModel, classifyBoard } from '../vision.js';

const dir = process.argv[2];
const modelPath = process.argv[3];
const model = modelPath ? loadModel(fs.readFileSync(modelPath)) : null;
const ids = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort((a, b) => a - b);
let ok = 0, sq = 0, sqOk = 0, boardsOk = 0, t = 0, tc = 0;
for (const id of ids) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, id + '.json')));
  const data = new Uint8ClampedArray(fs.readFileSync(path.join(dir, id + '.rgba')));
  const img = { data, width: meta.width, height: meta.height };
  const t0 = performance.now();
  const det = detectBoard(img);
  t += performance.now() - t0;
  const side = meta.quad[1][0] - meta.quad[0][0];
  let err = Infinity;
  if (det) err = Math.max(...det.quad.flatMap((p, k) => [Math.abs(p[0] - meta.quad[k][0]), Math.abs(p[1] - meta.quad[k][1])])) / side;
  const good = err < 0.012;
  if (good) ok++;
  let line = `#${id} ${meta.width}x${meta.height} board ${side}px err ${(err * 100).toFixed(2)}% ${good ? 'OK' : 'MISS'}${det && !det.refined ? ' (unrefined)' : ''}`;
  if (model && det) {
    const t1 = performance.now();
    const cells = classifyBoard(model, warpBoard(img, det.quad));
    tc += performance.now() - t1;
    const wrong = cells.map((c, i) => [c.label, meta.labels[i]]).filter(([p, y]) => p !== y);
    sq += 64; sqOk += 64 - wrong.length;
    if (!wrong.length) boardsOk++;
    line += ` | squares wrong: ${wrong.length} ${wrong.length ? JSON.stringify(wrong.slice(0, 6)) : ''} [${meta.set}]`;
  }
  console.log(line);
}
console.log(`\ndetected ${ok}/${ids.length}, avg detect ${(t / ids.length).toFixed(0)} ms`);
if (model) console.log(`squares ${sqOk}/${sq} (${(100 * sqOk / sq).toFixed(2)}%), perfect boards ${boardsOk}/${ids.length}, avg classify ${(tc / ids.length).toFixed(0)} ms`);
if (ok < ids.length * 0.95) process.exitCode = 1;
