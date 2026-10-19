/* eslint-disable @typescript-eslint/no-require-imports -- script Node em CommonJS */
// Gera ícones PNG simples (fundo roxo + "N" branco) para o manifest da PWA,
// sem depender de bibliotecas externas de imagem — usa apenas zlib nativo do
// Node para construir o PNG (fundo sólido + um glifo "N" bem simples em
// blocos de pixels).
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const BG = [109, 94, 241]; // #6d5ef1
const FG = [255, 255, 255];

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Glifo "N" em uma grade 5x7, escalado para o tamanho do ícone.
const GLYPH = [
  "10001",
  "11001",
  "10101",
  "10101",
  "10011",
  "10001",
  "10001",
];

function isGlyphPixel(px, py, size) {
  const margin = size * 0.28;
  const glyphW = size - margin * 2;
  const glyphH = glyphW * (GLYPH.length / GLYPH[0].length);
  const top = (size - glyphH) / 2;
  if (px < margin || px >= size - margin || py < top || py >= top + glyphH) return false;
  const col = Math.floor(((px - margin) / glyphW) * GLYPH[0].length);
  const row = Math.floor(((py - top) / glyphH) * GLYPH.length);
  return GLYPH[row]?.[col] === "1";
}

function buildPng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // sem filtro
    for (let x = 0; x < size; x++) {
      const glyph = isGlyphPixel(x, y, size);
      const [r, g, b] = glyph ? FG : BG;
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [72, 96, 128, 144, 152, 180, 192, 384, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buildPng(size));
}

console.log("Ícones gerados em public/icons/");
