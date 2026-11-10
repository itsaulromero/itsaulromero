// Contact links. Each one is its own small image, so it stays clickable
// and keeps its size on a phone instead of shrinking with the cards.
import { svgDoc, icon } from '../lib/draw.mjs';
import { text, width } from '../lib/type.mjs';

const H = 36;

export function link(l, t) {
  const label = { size: 14, weight: l.primary ? 600 : 500 };
  const W = Math.ceil(width(l.label, label) + 49);
  const color = l.primary ? t.onAccent : t.ink;
  const box = l.primary
    ? `<rect width="${W}" height="${H}" rx="9" fill="${t.accent}"/>`
    : `<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="8.25" fill="none" stroke="${t.hairline}" stroke-width="1.5"/>`;
  const body = `${box}${icon(l.icon, 12, 10, 16, color)}${text(l.label, 36, 23, { ...label, fill: color })}`;
  return svgDoc({ width: W, height: H, title: l.label, desc: l.href, body });
}
