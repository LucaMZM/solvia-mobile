// Original Solvía mark: a restrained sun above a horizon, rendered without external assets.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const size = 1024;
const pixels = Buffer.alloc((size * 3 + 1) * size);
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/branding/app-icon.png');

const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
const mix = (a, b, t) => a * (1 - t) + b * t;

for (let y = 0; y < size; y += 1) {
  const row = y * (size * 3 + 1);
  for (let x = 0; x < size; x += 1) {
    const offset = row + 1 + x * 3;
    const dx = x - 512;
    const dy = y - 437;
    const radius = Math.hypot(dx, dy);
    const halo = Math.exp(-((radius / 315) ** 2)) * 0.16;
    const sun = Math.max(0, Math.min(1, (208 - radius) / 4));
    const horizonDistance = Math.abs(y - (644 + 6 * Math.sin(x / 145)));
    const horizon = Math.exp(-((horizonDistance / 9) ** 2)) * Math.max(0, Math.min(1, (390 - Math.abs(dx)) / 80));
    const base = [7 + y / 160, 18 + y / 85, 34 + y / 60];
    const light = [250, 211 - Math.max(0, dy) / 17, 153 - Math.max(0, dy) / 12];
    const glow = Math.min(1, halo + sun * 0.95 + horizon * 0.58);
    for (let channel = 0; channel < 3; channel += 1) {
      pixels[offset + channel] = clamp(mix(base[channel], light[channel], glow));
    }
  }
}

const crcTable = Array.from({ length: 256 }, (_, number) => {
  let value = number;
  for (let i = 0; i < 8; i += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  let crc = 0xffffffff;
  for (const byte of Buffer.concat([name, data])) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  const check = Buffer.alloc(4);
  check.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, name, data, check]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 2;
fs.writeFileSync(output, Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header),
  chunk('IDAT', zlib.deflateSync(pixels, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]));
process.stdout.write(`Generated ${path.relative(process.cwd(), output)}\n`);
