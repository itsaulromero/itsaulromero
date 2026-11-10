// SVG document wrapper and icons.
import * as si from 'simple-icons';
import { takeGlyphs } from './type.mjs';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function svgDoc({ width, height, title, desc, css = '', defs = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>
${css.trim()}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
<defs>${takeGlyphs()}${defs}</defs>
${body}
</svg>
`;
}

const brand = new Map(
  Object.values(si)
    .filter((i) => i && i.slug)
    .map((i) => [i.slug, i.path]),
);

// Glyphs simple-icons does not ship. `solid` ones are a single filled path.
const CUSTOM = {
  cloud: { solid: 'M6.2 19.5h11.3a5 5 0 0 0 1-9.9 7 7 0 0 0-13.4-.7 5.3 5.3 0 0 0 1.1 10.6z' },
  linkedin: {
    solid:
      'M4.98 3.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5zM3 9.5h3.96V21H3zM9.6 9.5h3.8v1.6h.05c.53-1 1.83-1.95 3.75-1.95 4 0 4.8 2.5 4.8 5.9V21h-3.96v-5.3c0-1.3-.02-2.95-1.85-2.95s-2.14 1.4-2.14 2.85V21H9.6z',
  },
  globe: {
    line: '<circle cx="12" cy="12" r="9.2"/><ellipse cx="12" cy="12" rx="4" ry="9.2"/><path d="M2.8 12h18.4"/>',
  },
  mail: {
    line: '<rect x="2.8" y="5" width="18.4" height="14" rx="2.6"/><path d="m3.6 7 8.4 6.4L20.4 7"/>',
  },
};

// Icon in a size×size box at (x, y). Without `color`, solid icons inherit the parent's fill.
export function icon(slug, x, y, size, color) {
  const place = `transform="translate(${x} ${y}) scale(${+(size / 24).toFixed(4)})"`;
  const custom = CUSTOM[slug];
  if (custom?.line) {
    return `<g ${place} fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${custom.line}</g>`;
  }
  const d = custom?.solid ?? brand.get(slug);
  if (!d) throw new Error(`Unknown icon "${slug}"`);
  return `<path ${place} d="${d}"${color ? ` fill="${color}"` : ''}/>`;
}
