// Custom Astro image service: Astro's built-in sharp service, plus one
// extra step that tags every optimised .webp with a Display P3 ICC
// profile (src/displayp3.icc).
//
// Why: the source images in src/images are untagged, so browsers treat
// their pixels as sRGB, which Chromium/Safari show "muted" on wide-gamut
// screens. Tagging them as Display P3 (the pixel numbers stay exactly
// the same, sharp doesn't touch colour for untagged input) makes them
// render as vivid as the flat `color(display-p3 ...)` CSS variables in
// Layout.astro, so images and flat colours still meet without seams.
// public/images/*.webp are tagged directly in the files (same profile).
//
// The tagging is lossless: it only inserts an ICCP chunk into the WebP
// container; no pixels are re-encoded.
import sharpService from "astro/assets/services/sharp";
import { readFileSync } from "node:fs";

const ICC = readFileSync(new URL("./displayp3.icc", import.meta.url));

function chunk(fourcc, data) {
  const head = Buffer.alloc(8);
  head.write(fourcc, 0, "ascii");
  head.writeUInt32LE(data.length, 4);
  return Buffer.concat([head, data, data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
}

function tagWebp(input) {
  const buf = Buffer.from(input);
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return input;
  const body = buf.subarray(12);
  const fourcc = body.toString("ascii", 0, 4);
  let newBody;
  if (fourcc === "VP8X") {
    const len = body.readUInt32LE(4);
    const hdr = Buffer.from(body.subarray(8, 8 + len));
    if (hdr[0] & 0x20) return input; // already has an ICC profile
    hdr[0] |= 0x20;
    newBody = Buffer.concat([chunk("VP8X", hdr), chunk("ICCP", ICC), body.subarray(8 + len + (len % 2))]);
  } else {
    // Simple (non-extended) file: build a VP8X header from the bitstream.
    let w, h, alpha = false;
    if (fourcc === "VP8 ") {
      w = body.readUInt16LE(14) & 0x3fff;
      h = body.readUInt16LE(16) & 0x3fff;
    } else if (fourcc === "VP8L") {
      const bits = body.readUInt32LE(9);
      w = (bits & 0x3fff) + 1;
      h = ((bits >> 14) & 0x3fff) + 1;
      alpha = ((bits >> 28) & 1) === 1;
    } else {
      return input;
    }
    const vp8x = Buffer.alloc(10);
    vp8x[0] = 0x20 | (alpha ? 0x10 : 0);
    vp8x.writeUIntLE(w - 1, 4, 3);
    vp8x.writeUIntLE(h - 1, 7, 3);
    newBody = Buffer.concat([chunk("VP8X", vp8x), chunk("ICCP", ICC), body]);
  }
  const out = Buffer.alloc(12);
  out.write("RIFF", 0, "ascii");
  out.writeUInt32LE(4 + newBody.length, 4);
  out.write("WEBP", 8, "ascii");
  return Buffer.concat([out, newBody]);
}

// Removes an existing ICCP chunk (keeps pixels as-is) so sharp doesn't
// colour-convert the source to sRGB before we tag the result as P3.
function untagWebp(input) {
  const buf = Buffer.from(input);
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return input;
  if (buf.toString("ascii", 12, 16) !== "VP8X" || !(buf[20] & 0x20)) return input;
  const parts = [];
  let pos = 12;
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    const len = buf.readUInt32LE(pos + 4);
    const end = pos + 8 + len + (len % 2);
    if (id === "ICCP") { pos = end; continue; }
    const c = Buffer.from(buf.subarray(pos, end));
    if (id === "VP8X") c[8] &= ~0x20;
    parts.push(c);
    pos = end;
  }
  const body = Buffer.concat(parts);
  const head = Buffer.alloc(12);
  head.write("RIFF", 0, "ascii");
  head.writeUInt32LE(4 + body.length, 4);
  head.write("WEBP", 8, "ascii");
  return Buffer.concat([head, body]);
}

export default {
  ...sharpService,
  async transform(inputBuffer, transformOptions, config) {
    const result = await sharpService.transform(untagWebp(inputBuffer), transformOptions, config);
    if (result.format === "webp") {
      return { ...result, data: tagWebp(result.data) };
    }
    return result;
  },
};
