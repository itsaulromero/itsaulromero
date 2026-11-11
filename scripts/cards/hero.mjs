// Hero card: greeting, name, one sentence and three facts, on a card with a soft glow in the accent color.
// On load the name rises and the accent mark lands on the "ú" while the eyes watch.
// After that it stays alive: the stack orbits in the corner, the glows breathe,
// and every few seconds the eyes glance at the accent mark and it hops.
import { WIDTH as W } from '../lib/tokens.mjs';
import { svgDoc, icon, brandColor, card } from '../lib/draw.mjs';
import { text, inline, width, outline, splitAccent, bearing } from '../lib/type.mjs';

const H = 366;
const PAD = 40;
const GREETING = { size: 22, weight: 500 };
const NAME = { size: 96, weight: 800, tracking: -0.03 };
const TAGLINE = { size: 21, weight: 400 };
const COLS = [PAD, 385, 655];

// Orbit: center just above the top-right corner, so only the lower arcs show.
const ORBIT = { cx: 772, cy: 4, rings: [58, 103, 148], count: [3, 5, 6], seconds: [46, 64, 84] };

// The name as outlines, with the accent mark of its first accented letter kept apart.
function nameParts(name, x, y) {
  const chars = [...name];
  const i = chars.findIndex((c) => c.normalize('NFD').length > 1);
  if (i < 0) return { base: outline(name, x, y, NAME), mark: '' };
  const gap = NAME.tracking * NAME.size;
  const pre = chars.slice(0, i).join('');
  const post = chars.slice(i + 1).join('');
  const xi = x + (pre ? width(pre, NAME) + gap : 0);
  const { base, mark } = splitAccent(chars[i], xi, y, NAME);
  const xp = xi + width(chars[i], NAME) + gap;
  return {
    base: (pre ? outline(pre, x, y, NAME) : '') + base + (post ? outline(post, xp, y, NAME) : ''),
    mark,
  };
}

// Stack icons dealt round-robin across the stations, so each ring mixes colors.
function orbitIcons(p) {
  const lists = p.stack.stations.map((s) => [...s.items]);
  const out = [];
  while (lists.some((l) => l.length)) for (const l of lists) if (l.length) out.push(l.shift());
  return out;
}

function orbit(p, t) {
  const icons = orbitIcons(p);
  let n = 0;
  return ORBIT.rings
    .map((r, ring) => {
      const chips = Array.from({ length: ORBIT.count[ring] }, (_, k) => {
        const it = icons[n++ % icons.length];
        const a = ((k / ORBIT.count[ring]) * 360 + ring * 40) * (Math.PI / 180);
        const x = ORBIT.cx + r * Math.cos(a);
        const y = ORBIT.cy + r * Math.sin(a);
        return `<g class="chip c${ring}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="${t.raised}" stroke="${t.cardBorder}"/>${icon(it.icon, +(x - 8).toFixed(1), +(y - 8).toFixed(1), 16, brandColor(it.icon, t))}</g>`;
      }).join('');
      return `<circle cx="${ORBIT.cx}" cy="${ORBIT.cy}" r="${r}" fill="none" stroke="${t.cardBorder}" stroke-dasharray="2 6"/><g class="ring r${ring}">${chips}</g>`;
    })
    .join('');
}

export function hero(p, t) {
  const dark = t.name === 'dark';
  const id = `hero-${t.name}`;

  const ex = PAD + width(p.greeting, GREETING) + 15;
  const ey = 54;
  const eye = (cx) =>
    `<g class="lid"><ellipse cx="${cx}" cy="${ey}" rx="7.5" ry="9.5" fill="${dark ? t.ink : '#ffffff'}"${dark ? '' : ` stroke="${t.ink}" stroke-width="1.6"`}/>` +
    `<circle class="pupil" cx="${cx}" cy="${ey + 1}" r="3.6" fill="${dark ? t.card : t.ink}"/></g>`;

  const nx = PAD + 1 - bearing(p.name[0], NAME);
  const name = nameParts(p.name, nx, 160);

  const tagline = p.tagline
    .map((line, i) => {
      const runs = line.map((r) => (r.strong ? { t: r.t, weight: 600, fill: t.ink } : { t: r.t, fill: t.body }));
      const out = inline(runs, PAD, 206 + i * 30, TAGLINE);
      if (out.width > W - 2 * PAD) throw new Error(`Tagline line ${i + 1} is ${Math.round(out.width)}px wide; it has ${W - 2 * PAD}px.`);
      return out.svg;
    })
    .join('');

  const facts = p.facts
    .map((f, i) => {
      const x = COLS[i];
      return (
        text(f.label, x, 294, { size: 13.5, weight: 500, fill: t.muted }) +
        text(f.value, x, 317, { size: 16.5, weight: 600, fill: t.ink }) +
        text(f.detail, x, 338, { size: 14, weight: 400, fill: t.muted })
      );
    })
    .join('');

  const [o1, o2, o3] = ORBIT.seconds;
  const css = `
.greet{animation:fade .6s ease both}
.name{animation:rise .9s cubic-bezier(.2,.8,.2,1) .1s both}
.mark{animation:land .6s cubic-bezier(.3,1.5,.5,1) 1s both,hop 6s ease-in-out 6.3s infinite}
.tag{animation:fade .7s ease .55s both}
.facts{animation:fade .7s ease .8s both}
.lid{transform-box:fill-box;transform-origin:50% 50%;animation:blink 6s 1.7s infinite}
.pupil{animation:look 6s .3s infinite}
.g1{animation:breathe 9s ease-in-out infinite}
.g2{animation:breathe 11s ease-in-out -4s infinite}
.orbit{animation:fade 1.2s ease .4s both}
.ring{transform-origin:${ORBIT.cx}px ${ORBIT.cy}px}
.chip{transform-box:fill-box;transform-origin:50% 50%}
.r0{animation:spin ${o1}s linear infinite}.c0{animation:spin ${o1}s linear infinite reverse}
.r1{animation:spin ${o2}s linear infinite reverse}.c1{animation:spin ${o2}s linear infinite}
.r2{animation:spin ${o3}s linear infinite}.c2{animation:spin ${o3}s linear infinite reverse}
@keyframes fade{from{opacity:0}}
@keyframes rise{from{opacity:0;transform:translateY(18px)}}
@keyframes land{from{opacity:0;transform:translateY(-40px)}}
@keyframes hop{0%,13%,23%,100%{transform:translateY(0)}18%{transform:translateY(-7px)}}
@keyframes blink{0%,2%,5%,50%,53%,100%{transform:scaleY(1)}3.5%,51.5%{transform:scaleY(.08)}}
@keyframes look{0%,6%{transform:translate(0,0)}12%,36%{transform:translate(-2.2px,3.2px)}44%,64%{transform:translate(0,0)}70%,82%{transform:translate(2.8px,-1.4px)}90%,100%{transform:translate(0,0)}}
@keyframes breathe{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}`;

  const inner = `
<rect class="g1" width="${W}" height="${H}" fill="url(#${id}-g1)"/>
<rect class="g2" width="${W}" height="${H}" fill="url(#${id}-g2)"/>
<g class="orbit">${orbit(p, t)}</g>`;
  const frame = card(t, id, W, H, inner);

  const defs = `${frame.defs}
<radialGradient id="${id}-g1" gradientUnits="userSpaceOnUse" cx="90" cy="-20" r="430"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow[0]}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-g2" gradientUnits="userSpaceOnUse" cx="${W - 40}" cy="${H + 30}" r="420"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow[1]}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>`;

  const body = `${frame.body}
<g class="greet">${text(p.greeting, PAD, 62, { ...GREETING, fill: t.muted })}${eye(ex + 8)}${eye(ex + 27)}</g>
<path class="name" d="${name.base}" fill="${t.ink}"/>
${name.mark ? `<path class="mark" d="${name.mark}" fill="${t.accent}"/>` : ''}
<g class="tag">${tagline}</g>
<g class="facts"><line x1="${PAD}" y1="266.5" x2="${W - PAD}" y2="266.5" stroke="${t.cardBorder}"/>${facts}</g>`;

  return svgDoc({
    width: W,
    height: H,
    title: `${p.greeting} ${p.name}`,
    desc: `${p.tagline.map((l) => l.map((r) => r.t).join('')).join(' ')} ${p.facts.map((f) => `${f.label}: ${f.value}, ${f.detail}.`).join(' ')}`,
    css,
    defs,
    body,
  });
}
