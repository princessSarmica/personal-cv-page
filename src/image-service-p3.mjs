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
// Display P3 ICC profile (same bytes as src/displayp3.icc), embedded as
// base64 because Astro bundles this file into the build output, where a
// file read relative to import.meta.url would no longer find it.
const ICC = Buffer.from(
  "AAAJzAAAAAACQAAAbW50clJHQiBYWVogB+oACQAdAAwAAAAAYWNzcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPbWAAEA" +
  "AAAA0y0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJZGVzYwAAAPAAAABlY3BydAAA" +
  "AVgAAAAWd3RwdAAAAXAAAAAUclhZWgAAAYQAAAAUZ1hZWgAAAZgAAAAUYlhZWgAAAawAAAAUclRSQwAAAcAAAAgMZ1RSQwAAAcAA" +
  "AAgMYlRSQwAAAcAAAAgMZGVzYwAAAAAAAAALRGlzcGxheSBQMwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0ZXh0AAAAAFB1YmxpYyBkb21haW4AAABYWVogAAAA" +
  "AAAA9tYAAQAAAADTLVhZWiAAAAAAAACD4QAAPb////+7WFlaIAAAAAAAAErBAACxNQAACrlYWVogAAAAAAAAKDoAABELAADIxmN1" +
  "cnYAAAAAAAAEAAAAAAUACgAPABQAGQAeACMAKAAtADIANwA7AEAARQBKAE8AVABZAF4AYwBoAG0AcgB3AHwAgQCGAIsAkACVAJoA" +
  "nwCkAKkArgCyALcAvADBAMYAywDQANUA2wDgAOUA6wDwAPYA+wEBAQcBDQETARkBHwElASsBMgE4AT4BRQFMAVIBWQFgAWcBbgF1" +
  "AXwBgwGLAZIBmgGhAakBsQG5AcEByQHRAdkB4QHpAfIB+gIDAgwCFAIdAiYCLwI4AkECSwJUAl0CZwJxAnoChAKOApgCogKsArYC" +
  "wQLLAtUC4ALrAvUDAAMLAxYDIQMtAzgDQwNPA1oDZgNyA34DigOWA6IDrgO6A8cD0wPgA+wD+QQGBBMEIAQtBDsESARVBGMEcQR+" +
  "BIwEmgSoBLYExATTBOEE8AT+BQ0FHAUrBToFSQVYBWcFdwWGBZYFpgW1BcUF1QXlBfYGBgYWBicGNwZIBlkGagZ7BowGnQavBsAG" +
  "0QbjBvUHBwcZBysHPQdPB2EHdAeGB5kHrAe/B9IH5Qf4CAsIHwgyCEYIWghuCIIIlgiqCL4I0gjnCPsJEAklCToJTwlkCXkJjwmk" +
  "CboJzwnlCfsKEQonCj0KVApqCoEKmAquCsUK3ArzCwsLIgs5C1ELaQuAC5gLsAvIC+EL+QwSDCoMQwxcDHUMjgynDMAM2QzzDQ0N" +
  "Jg1ADVoNdA2ODakNww3eDfgOEw4uDkkOZA5/DpsOtg7SDu4PCQ8lD0EPXg96D5YPsw/PD+wQCRAmEEMQYRB+EJsQuRDXEPURExEx" +
  "EU8RbRGMEaoRyRHoEgcSJhJFEmQShBKjEsMS4xMDEyMTQxNjE4MTpBPFE+UUBhQnFEkUahSLFK0UzhTwFRIVNBVWFXgVmxW9FeAW" +
  "AxYmFkkWbBaPFrIW1hb6Fx0XQRdlF4kXrhfSF/cYGxhAGGUYihivGNUY+hkgGUUZaxmRGbcZ3RoEGioaURp3Gp4axRrsGxQbOxtj" +
  "G4obshvaHAIcKhxSHHscoxzMHPUdHh1HHXAdmR3DHeweFh5AHmoelB6+HukfEx8+H2kflB+/H+ogFSBBIGwgmCDEIPAhHCFIIXUh" +
  "oSHOIfsiJyJVIoIiryLdIwojOCNmI5QjwiPwJB8kTSR8JKsk2iUJJTglaCWXJccl9yYnJlcmhya3JugnGCdJJ3onqyfcKA0oPyhx" +
  "KKIo1CkGKTgpaymdKdAqAio1KmgqmyrPKwIrNitpK50r0SwFLDksbiyiLNctDC1BLXYtqy3hLhYuTC6CLrcu7i8kL1ovkS/HL/4w" +
  "NTBsMKQw2zESMUoxgjG6MfIyKjJjMpsy1DMNM0YzfzO4M/E0KzRlNJ402DUTNU01hzXCNf02NzZyNq426TckN2A3nDfXOBQ4UDiM" +
  "OMg5BTlCOX85vDn5OjY6dDqyOu87LTtrO6o76DwnPGU8pDzjPSI9YT2hPeA+ID5gPqA+4D8hP2E/oj/iQCNAZECmQOdBKUFqQaxB" +
  "7kIwQnJCtUL3QzpDfUPARANER0SKRM5FEkVVRZpF3kYiRmdGq0bwRzVHe0fASAVIS0iRSNdJHUljSalJ8Eo3Sn1KxEsMS1NLmkvi" +
  "TCpMcky6TQJNSk2TTdxOJU5uTrdPAE9JT5NP3VAnUHFQu1EGUVBRm1HmUjFSfFLHUxNTX1OqU/ZUQlSPVNtVKFV1VcJWD1ZcVqlW" +
  "91dEV5JX4FgvWH1Yy1kaWWlZuFoHWlZaplr1W0VblVvlXDVchlzWXSddeF3JXhpebF69Xw9fYV+zYAVgV2CqYPxhT2GiYfViSWKc" +
  "YvBjQ2OXY+tkQGSUZOllPWWSZedmPWaSZuhnPWeTZ+loP2iWaOxpQ2maafFqSGqfavdrT2una/9sV2yvbQhtYG25bhJua27Ebx5v" +
  "eG/RcCtwhnDgcTpxlXHwcktypnMBc11zuHQUdHB0zHUodYV14XY+dpt2+HdWd7N4EXhueMx5KnmJeed6RnqlewR7Y3vCfCF8gXzh" +
  "fUF9oX4BfmJ+wn8jf4R/5YBHgKiBCoFrgc2CMIKSgvSDV4O6hB2EgITjhUeFq4YOhnKG14c7h5+IBIhpiM6JM4mZif6KZIrKizCL" +
  "lov8jGOMyo0xjZiN/45mjs6PNo+ekAaQbpDWkT+RqJIRknqS45NNk7aUIJSKlPSVX5XJljSWn5cKl3WX4JhMmLiZJJmQmfyaaJrV" +
  "m0Kbr5wcnImc951kndKeQJ6unx2fi5/6oGmg2KFHobaiJqKWowajdqPmpFakx6U4pammGqaLpv2nbqfgqFKoxKk3qamqHKqPqwKr" +
  "davprFys0K1ErbiuLa6hrxavi7AAsHWw6rFgsdayS7LCszizrrQltJy1E7WKtgG2ebbwt2i34LhZuNG5SrnCuju6tbsuu6e8Ibyb" +
  "vRW9j74KvoS+/796v/XAcMDswWfB48JfwtvDWMPUxFHEzsVLxcjGRsbDx0HHv8g9yLzJOsm5yjjKt8s2y7bMNcy1zTXNtc42zrbP" +
  "N8+40DnQutE80b7SP9LB00TTxtRJ1MvVTtXR1lXW2Ndc1+DYZNjo2WzZ8dp22vvbgNwF3IrdEN2W3hzeot8p36/gNuC94UThzOJT" +
  "4tvjY+Pr5HPk/OWE5g3mlucf56noMui86Ubp0Opb6uXrcOv77IbtEe2c7ijutO9A78zwWPDl8XLx//KM8xnzp/Q09ML1UPXe9m32" +
  "+/eK+Bn4qPk4+cf6V/rn+3f8B/yY/Sn9uv5L/tz/bf//",
  "base64"
);

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
