// Builds "Integer Pixel Serif": Instrument Serif rasterised onto a coarse grid
// of pixels, written back out as a font so the site can use it like any
// other typeface (crisp at every size, selectable, no runtime cost).
//
//   bun run pixel-font   (or: node scripts/pixel-font.mjs [cellsPerEm], default 40)
//
// Per glyph: the outline is sampled 4 × 4 times in every grid cell to get the
// share of the cell it covers. A cell is lit when at least half of it is
// covered, so the edges of stems are clean pixel steps. Hairlines thinner than
// half a cell would vanish under that rule, so a cell is also lit when it is
// the strongest point across a thin stroke (a local maximum, covered at least
// HAIR) and touches no half-covered cell. Lit cells are merged into runs and
// emitted as rectangles.
//
// An ordered (Bayer) dither was tried for the partly covered cells; along a
// straight edge it alternates on/off cell by cell and the stems read as
// zip-fastener teeth, so the edges are thresholded instead.
//
// Advance widths are rounded to whole cells, so every glyph on a line sits on
// one shared pixel grid. Kerning is dropped. Source: fonts-src/ (OFL 1.1).

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import opentype from 'opentype.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CELLS_PER_EM = Number(process.argv[2] ?? 40);
const SS = 4; // samples per cell edge

const HAIR = 0.2;

/* Basic Latin, Latin-1, Latin Extended-A (all of Czech), general punctuation
   (dashes, quotes, ellipsis) and the euro sign. */
const RANGES = [
  [0x20, 0x7e],
  [0xa0, 0x17f],
  [0x2010, 0x2027],
  [0x20ac, 0x20ac],
];
const wanted = (u) => RANGES.some(([a, b]) => u >= a && u <= b);

/* Outline -> closed polygons, in font units with y pointing down. */
function polygons(path) {
  const polys = [];
  let cur = null;
  let x = 0;
  let y = 0;
  const N = 10;
  for (const c of path.commands) {
    if (c.type === 'M') {
      cur = [[c.x, c.y]];
      polys.push(cur);
      x = c.x;
      y = c.y;
    } else if (c.type === 'L') {
      cur.push([c.x, c.y]);
      x = c.x;
      y = c.y;
    } else if (c.type === 'Q') {
      for (let i = 1; i <= N; i++) {
        const t = i / N;
        const u = 1 - t;
        cur.push([
          u * u * x + 2 * u * t * c.x1 + t * t * c.x,
          u * u * y + 2 * u * t * c.y1 + t * t * c.y,
        ]);
      }
      x = c.x;
      y = c.y;
    } else if (c.type === 'C') {
      for (let i = 1; i <= N; i++) {
        const t = i / N;
        const u = 1 - t;
        cur.push([
          u * u * u * x +
            3 * u * u * t * c.x1 +
            3 * u * t * t * c.x2 +
            t * t * t * c.x,
          u * u * u * y +
            3 * u * u * t * c.y1 +
            3 * u * t * t * c.y2 +
            t * t * t * c.y,
        ]);
      }
      x = c.x;
      y = c.y;
    }
  }
  return polys;
}

/* Nonzero-winding coverage of every cell, via one scanline per sample row. */
function rasterise(polys, cell, box) {
  const edges = [];
  for (const p of polys) {
    for (let i = 0; i < p.length; i++) {
      const [x0, y0] = p[i];
      const [x1, y1] = p[(i + 1) % p.length];
      if (y0 !== y1) edges.push([x0, y0, x1, y1]);
    }
  }
  const cols = box.c1 - box.c0;
  const rows = box.r1 - box.r0;
  const cov = Array.from({ length: rows }, () => new Float32Array(cols));
  const step = cell / SS;
  for (let r = 0; r < rows; r++) {
    for (let s = 0; s < SS; s++) {
      const sy = (box.r0 + r) * cell + (s + 0.5) * step;
      const hits = [];
      for (const [x0, y0, x1, y1] of edges) {
        if ((sy >= y0 && sy < y1) || (sy >= y1 && sy < y0)) {
          hits.push([
            x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0),
            y1 > y0 ? 1 : -1,
          ]);
        }
      }
      if (hits.length === 0) continue;
      hits.sort((a, b) => a[0] - b[0]);
      for (let c = 0; c < cols; c++) {
        for (let t = 0; t < SS; t++) {
          const sx = (box.c0 + c) * cell + (t + 0.5) * step;
          let w = 0;
          for (const [hx, d] of hits) {
            if (hx > sx) break;
            w += d;
          }
          if (w !== 0) cov[r][c] += 1 / (SS * SS);
        }
      }
    }
  }
  return cov;
}

function lit(cov, r, c) {
  const at = (rr, cc) => cov[rr]?.[cc] ?? 0;
  const v = at(r, c);
  if (v >= 0.5) return true;
  if (v < HAIR) return false;
  const n = [at(r - 1, c), at(r + 1, c), at(r, c - 1), at(r, c + 1)];
  if (n.some((x) => x >= 0.5)) return false;
  const peakX = v >= n[2] && v >= n[3];
  const peakY = v >= n[0] && v >= n[1];
  return peakX || peakY;
}

function pixelGlyph(src, upm) {
  const cell = upm / CELLS_PER_EM;
  const advance =
    Math.max(0, Math.round((src.advanceWidth ?? 0) / cell)) * cell;
  const out = new opentype.Path();
  const path = src.getPath(0, 0, upm); // font units, y down, baseline at 0
  const polys = polygons(path);
  if (polys.length) {
    const bb = path.getBoundingBox();
    const box = {
      c0: Math.floor(bb.x1 / cell),
      c1: Math.ceil(bb.x2 / cell),
      r0: Math.floor(bb.y1 / cell),
      r1: Math.ceil(bb.y2 / cell),
    };
    const cov = rasterise(polys, cell, box);
    /* Runs of lit cells per row; a run identical to one in the row above
       extends that rectangle downwards instead of starting a new one, so a
       straight stem is one contour, not one per row. */
    const rects = [];
    let open = new Map(); // "c0:c1" -> rect still growing
    cov.forEach((row, r) => {
      const gy = box.r0 + r;
      const next = new Map();
      let run = -1;
      for (let c = 0; c <= row.length; c++) {
        const on = c < row.length && lit(cov, r, c);
        if (on && run < 0) run = c;
        if (!on && run >= 0) {
          const key = `${run}:${c}`;
          const rect = open.get(key) ?? { c0: run, c1: c, r0: gy, r1: gy };
          if (!open.has(key)) rects.push(rect);
          rect.r1 = gy;
          next.set(key, rect);
          run = -1;
        }
      }
      open = next;
    });
    for (const q of rects) {
      /* y up for the font: top edge -r0*cell, bottom -(r1+1)*cell. */
      const x0 = (box.c0 + q.c0) * cell;
      const x1 = (box.c0 + q.c1) * cell;
      const yTop = -q.r0 * cell;
      const yBot = -(q.r1 + 1) * cell;
      out.moveTo(x0, yBot);
      out.lineTo(x1, yBot);
      out.lineTo(x1, yTop);
      out.lineTo(x0, yTop);
      out.close();
    }
  }
  return new opentype.Glyph({
    name: src.name,
    unicode: src.unicode,
    unicodes: src.unicodes,
    advanceWidth: advance,
    path: out,
  });
}

function build(srcFile, styleName, outFile) {
  const buf = readFileSync(join(root, 'fonts-src', srcFile));
  const src = opentype.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  );
  const upm = src.unitsPerEm;
  const glyphs = [
    new opentype.Glyph({
      name: '.notdef',
      advanceWidth: Math.round(upm / 2),
      path: new opentype.Path(),
    }),
  ];
  for (let i = 0; i < src.glyphs.length; i++) {
    const g = src.glyphs.get(i);
    const unicodes = (g.unicodes ?? []).filter(wanted);
    if (!unicodes.length) continue;
    g.unicodes = unicodes;
    g.unicode = unicodes[0];
    glyphs.push(pixelGlyph(g, upm));
  }
  const font = new opentype.Font({
    familyName: 'Integer Pixel Serif',
    styleName,
    unitsPerEm: upm,
    ascender: src.ascender,
    descender: src.descender,
    designer:
      'Integer Studio, from Instrument Serif by The Instrument Serif Project Authors',
    copyright:
      'Copyright 2022 The Instrument Serif Project Authors (https://github.com/Instrument/instrument-serif). Pixel version by Integer Studio.',
    license: 'SIL Open Font License, Version 1.1',
    licenseURL: 'https://openfontlicense.org',
    version: '1.000',
    glyphs,
  });
  const outDir = join(root, 'public', 'fonts');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, outFile), Buffer.from(font.toArrayBuffer()));
  console.log(`${outFile}: ${glyphs.length} glyphs, ${CELLS_PER_EM} cells/em`);
}

build(
  'InstrumentSerif-Regular.ttf',
  'Regular',
  'IntegerPixelSerif-Regular.otf'
);
build('InstrumentSerif-Italic.ttf', 'Italic', 'IntegerPixelSerif-Italic.otf');
copyFileSync(
  join(root, 'fonts-src', 'OFL.txt'),
  join(root, 'public', 'fonts', 'IntegerPixelSerif-OFL.txt')
);
