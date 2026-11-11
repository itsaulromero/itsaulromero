// Typesetting. Text is converted to outlines with Mona Sans (GitHub's own
// typeface), so every card looks identical on any device and widths are exact.
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FILES = join(dirname(fileURLToPath(import.meta.url)), '../../node_modules/@fontsource/mona-sans/files');
const fonts = new Map();

function font(weight) {
  if (!fonts.has(weight)) {
    const buf = readFileSync(join(FILES, `mona-sans-latin-${weight}-normal.woff`));
    fonts.set(weight, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return fonts.get(weight);
}

// Text that comes from the API can contain characters the font lacks; those become "?".
function glyphFor(f, ch) {
  const glyph = f.charToGlyph(ch);
  if (glyph.index !== 0) return glyph;
  console.warn(`! Mona Sans has no glyph for "${ch}", using "?"`);
  return f.charToGlyph('?');
}

function layout(str, { size, weight = 400, tracking = 0 }) {
  const f = font(weight);
  const k = size / f.unitsPerEm;
  const chars = [...String(str)];
  const run = [];
  let x = 0;
  chars.forEach((ch, i) => {
    const glyph = glyphFor(f, ch);
    run.push({ glyph, x });
    x += glyph.advanceWidth * k + (i < chars.length - 1 ? tracking * size : 0);
  });
  return { run, width: x };
}

export const width = (str, opts) => layout(str, opts).width;

// Outline of one line of text as SVG path data. anchor: start | middle | end.
// Used for display type; body text goes through text(), which reuses glyphs.
export function outline(str, x, y, opts) {
  const { run, width: w } = layout(str, opts);
  const x0 = opts.anchor === 'end' ? x - w : opts.anchor === 'middle' ? x - w / 2 : x;
  return run.map(({ glyph, x: gx }) => glyph.getPath(x0 + gx, y, opts.size).toPathData(2)).join('');
}

// Each glyph is drawn once per document, at 100px, and reused with <use>.
const REF = 100;
const glyphs = new Map();

function glyphRef(weight, ch) {
  const key = `${weight}:${ch}`;
  if (!glyphs.has(key)) {
    const d = glyphFor(font(weight), ch).getPath(0, 0, REF).toPathData(1);
    glyphs.set(key, { id: `g${glyphs.size.toString(36)}`, d });
  }
  return glyphs.get(key).id;
}

// The <path> definitions for every glyph used since the last call. svgDoc() calls this.
export function takeGlyphs() {
  const out = [...glyphs.values()].map((g) => `<path id="${g.id}" d="${g.d}"/>`).join('');
  glyphs.clear();
  return out;
}

const num = (v) => +v.toFixed(2);

// One line of text. Leave `fill` out to inherit it from a parent group.
export function text(str, x, y, opts) {
  const { size, weight = 400, tracking = 0 } = opts;
  const w = width(str, opts);
  const x0 = opts.anchor === 'end' ? x - w : opts.anchor === 'middle' ? x - w / 2 : x;
  const f = font(weight);
  let cx = 0;
  let uses = '';
  for (const ch of String(str)) {
    if (ch !== ' ') uses += `<use href="#${glyphRef(weight, ch)}"${cx ? ` x="${num(cx)}"` : ''}/>`;
    cx += (glyphFor(f, ch).advanceWidth * REF) / f.unitsPerEm + tracking * REF;
  }
  const fill = opts.fill ? ` fill="${opts.fill}"` : '';
  return `<g transform="translate(${num(x0)} ${num(y)}) scale(${+(size / REF).toFixed(4)})"${fill}>${uses}</g>`;
}

// Several runs on one baseline, each with its own weight and color.
export function inline(runs, x, y, base) {
  let cx = x;
  const svg = runs
    .map((r) => {
      const opts = { ...base, ...r };
      const out = text(r.t, cx, y, opts);
      cx += width(r.t, opts);
      return out;
    })
    .join('');
  return { svg, width: cx - x };
}

// Splits an accented letter into its base and its accent mark (the highest contour).
export function splitAccent(ch, x, y, { size, weight }) {
  const path = font(weight).charToGlyph(ch).getPath(x, y, size);
  const contours = [];
  for (const cmd of path.commands) {
    if (cmd.type === 'M') contours.push([]);
    contours.at(-1).push(cmd);
  }
  const bottom = (cs) => Math.max(...cs.flatMap((c) => [c.y, c.y1, c.y2].filter((v) => v !== undefined)));
  const mark = contours.reduce((a, b) => (bottom(a) < bottom(b) ? a : b));
  const data = (list) => {
    const p = new opentype.Path();
    p.commands = list.flat();
    return p.toPathData(2);
  };
  return { base: data(contours.filter((c) => c !== mark)), mark: data([mark]) };
}

// Left side bearing in pixels, to align large type optically with small type.
export function bearing(ch, { size, weight }) {
  const f = font(weight);
  return (f.charToGlyph(ch).getMetrics().xMin * size) / f.unitsPerEm;
}
