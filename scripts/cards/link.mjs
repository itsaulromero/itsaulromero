// Contact links. Each one is its own small image, so it stays clickable
// and keeps its size on a phone instead of shrinking with the cards.
// The main link is filled with blue, white text and a light sweeps across it every few seconds.
import { svgDoc, icon, brandColor } from '../lib/draw.mjs';
import { text, width } from '../lib/type.mjs';

const H = 36;

export function link(l, t) {
  const label = { size: 14, weight: l.primary ? 600 : 500 };
  const W = Math.ceil(width(l.label, label) + 49);
  const ink = l.primary ? t.onAccent : t.ink;
  const iconColor = l.primary ? t.onAccent : l.icon === 'linkedin' ? brandColor('linkedin', t) : l.icon === 'mail' ? t.accent : t.ink;
  const box = l.primary
    ? `<rect width="${W}" height="${H}" rx="9" fill="${t.button}"/><g clip-path="url(#clip)"><rect class="shine" x="-40" y="-10" width="26" height="${H + 20}" fill="#ffffff" fill-opacity=".28" transform="skewX(-20)"/></g>`
    : `<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="8.25" fill="${t.card}" stroke="${t.cardBorder}" stroke-width="1.5"/>`;
  const body = `${box}${icon(l.icon, 12, 10, 16, iconColor)}${text(l.label, 36, 23, { ...label, fill: ink })}`;
  return svgDoc({
    width: W,
    height: H,
    title: l.label,
    desc: l.href,
    css: l.primary ? `.shine{animation:shine 5s ease-in-out 1.5s infinite}@keyframes shine{0%{transform:translateX(0) skewX(-20deg)}22%,100%{transform:translateX(${W + 80}px) skewX(-20deg)}}` : '',
    defs: l.primary ? `<clipPath id="clip"><rect width="${W}" height="${H}" rx="9"/></clipPath>` : '',
    body,
  });
}
