// 依存なしでPNGアイコンを描く（icon.svg と同じ図柄）
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x5f, 0x84, 0x66];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};
// 512座標系での図柄判定
function isFigure(x, y) {
  const r = Math.hypot(x - 256, y - 256);
  if (r > 133 && r < 167) return true;
  if (Math.hypot(x - 256, y - 176) < 30) return true;
  if (segDist(x, y, 256, 236, 256, 336) < 13) return true;
  if (segDist(x, y, 190, 214, 256, 262) < 13) return true;
  if (segDist(x, y, 256, 262, 322, 214) < 13) return true;
  return false;
}
function inRoundRect(x, y) {
  const rad = 112, cx = Math.min(Math.max(x, rad), 512 - rad), cy = Math.min(Math.max(y, rad), 512 - rad);
  return Math.hypot(x - cx, y - cy) <= rad;
}
function draw(size, { maskable = false, opaque = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const S = 4;
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    let bg = 0, fig = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      const x = ((px + (sx + 0.5) / S) / size) * 512, y = ((py + (sy + 0.5) / S) / size) * 512;
      const inside = maskable || opaque || inRoundRect(x, y);
      if (!inside) continue;
      bg++;
      // マスカブルは中央80%に図柄を収める
      const fx = maskable ? 256 + (x - 256) / 0.8 : x, fy = maskable ? 256 + (y - 256) / 0.8 : y;
      if (isFigure(fx, fy)) fig++;
    }
    const a = bg / (S * S), f = bg ? fig / bg : 0;
    const i = (py * size + px) * 4;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.round(BG[c] * (1 - f) + 255 * f);
    buf[i + 3] = Math.round(a * 255);
  }
  return png(size, buf);
}
writeFileSync('public/icon-192.png', draw(192));
writeFileSync('public/icon-512.png', draw(512));
writeFileSync('public/icon-512-maskable.png', draw(512, { maskable: true }));
writeFileSync('public/apple-touch-icon.png', draw(180, { opaque: true }));
console.log('icons written');
