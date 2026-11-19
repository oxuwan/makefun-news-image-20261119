// news-image-20261119 entry: copy the front-page image beside this file to
// the make.fun output directory. Node 22, standard library only, no network.
// Validates the image first: it must be a PNG of at most 1 MiB and at most
// 1024 by 1024 pixels, or the program refuses to write it.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const src = new URL('./entry.png', import.meta.url);
const buf = readFileSync(src);

if (buf.length > MAX_BYTES) {
  throw new Error(`entry.png is ${buf.length} bytes, over the 1 MiB limit`);
}
if (!buf.subarray(0, 8).equals(PNG_MAGIC)) {
  throw new Error('entry.png does not start with the PNG magic bytes');
}
if (buf.length < 24 || buf.toString('latin1', 12, 16) !== 'IHDR') {
  throw new Error('entry.png has no IHDR chunk where a PNG header belongs');
}
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}
// A whole PNG ends with the 12-byte IEND chunk; refuse a truncated file.
const IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82]);
if (buf.length < 12 || !buf.subarray(buf.length - 12).equals(IEND)) {
  throw new Error('entry.png is truncated: no IEND chunk at the end');
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const dest = join(outDir, 'entry.png');
writeFileSync(dest, buf);
console.log(`wrote ${dest} (${buf.length} bytes, ${width}x${height})`);
