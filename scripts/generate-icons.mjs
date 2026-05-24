import { deflateSync } from "zlib";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dir, "..", "public", "icons");

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return ((crc ^ 0xffffffff) >>> 0);
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([t, data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, t, data, c]);
}

function makePNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2; // RGB

  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const o = y * rowSize + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdrData),
    chunk("IDAT", deflateSync(raw, { level: 1 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, "icon-192.png"), makePNG(192, 0, 61, 165));
writeFileSync(join(publicDir, "icon-512.png"), makePNG(512, 0, 61, 165));
writeFileSync(join(publicDir, "icon-apple.png"), makePNG(180, 0, 61, 165));
console.log("Icons created in", publicDir);
