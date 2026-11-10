// Hero: greeting, name, one sentence and three facts.
// One orchestrated moment on load: the name rises, the accent mark lands on the "ú",
// and the eyes (a nod to the 👀 of the old README) look at it and blink.
// After that, every few seconds the eyes glance at the accent mark and it hops.
import { WIDTH as W } from '../lib/tokens.mjs';
import { svgDoc } from '../lib/draw.mjs';
import { text, inline, width, outline, splitAccent, bearing } from '../lib/type.mjs';

const H = 318;
const GREETING = { size: 22, weight: 500 };
const NAME = { size: 108, weight: 800, tracking: -0.03 };
const TAGLINE = { size: 21, weight: 400 };
const COLS = [0, 290, 580];

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

export function hero(p, t) {
  const dark = t.name === 'dark';

  // Eyes, right after the greeting.
  const ex = width(p.greeting, GREETING) + 15;
  const ey = 25;
  const eye = (cx) =>
    `<g class="lid"><ellipse cx="${cx}" cy="${ey}" rx="7.5" ry="9.5" fill="${dark ? t.ink : '#ffffff'}"${dark ? '' : ` stroke="${t.ink}" stroke-width="1.6"`}/>` +
    `<circle class="pupil" cx="${cx}" cy="${ey + 1}" r="3.6" fill="${dark ? t.page : t.ink}"/></g>`;

  const nx = 1 - bearing(p.name[0], NAME);
  const name = nameParts(p.name, nx, 142);

  const tagline = p.tagline
    .map((line, i) => {
      const runs = line.map((r) => (r.strong ? { t: r.t, weight: 600, fill: t.ink } : { t: r.t, fill: t.body }));
      const out = inline(runs, 0, 188 + i * 30, TAGLINE);
      if (out.width > W) throw new Error(`Tagline line ${i + 1} is ${Math.round(out.width)}px wide; the card is ${W}px.`);
      return out.svg;
    })
    .join('');

  const facts = p.facts
    .map((f, i) => {
      const x = COLS[i];
      return (
        text(f.label, x, 262, { size: 13.5, weight: 500, fill: t.muted }) +
        text(f.value, x, 285, { size: 16.5, weight: 600, fill: t.ink }) +
        text(f.detail, x, 306, { size: 14, weight: 400, fill: t.muted })
      );
    })
    .join('');

  const css = `
.greet{animation:fade .6s ease both}
.name{animation:rise .9s cubic-bezier(.2,.8,.2,1) .1s both}
.mark{animation:land .6s cubic-bezier(.3,1.5,.5,1) 1s both,hop 6s ease-in-out 6.3s infinite}
.tag{animation:fade .7s ease .55s both}
.facts{animation:fade .7s ease .8s both}
.lid{transform-box:fill-box;transform-origin:50% 50%;animation:blink 6s 1.7s infinite}
.pupil{animation:look 6s .3s infinite}
@keyframes fade{from{opacity:0}}
@keyframes rise{from{opacity:0;transform:translateY(18px)}}
@keyframes land{from{opacity:0;transform:translateY(-40px)}}
@keyframes hop{0%,13%,23%,100%{transform:translateY(0)}18%{transform:translateY(-7px)}}
@keyframes blink{0%,2%,5%,50%,53%,100%{transform:scaleY(1)}3.5%,51.5%{transform:scaleY(.08)}}
@keyframes look{0%,6%{transform:translate(0,0)}12%,36%{transform:translate(-2.2px,3.2px)}44%,64%{transform:translate(0,0)}70%,80%{transform:translate(2.6px,.4px)}88%,100%{transform:translate(0,0)}}`;

  const body = `
<g class="greet">${text(p.greeting, 0, 33, { ...GREETING, fill: t.muted })}${eye(ex + 8)}${eye(ex + 27)}</g>
<path class="name" d="${name.base}" fill="${t.ink}"/>
${name.mark ? `<path class="mark" d="${name.mark}" fill="${t.accent}"/>` : ''}
<g class="tag">${tagline}</g>
<g class="facts">${facts}</g>`;

  return svgDoc({
    width: W,
    height: H,
    title: `${p.greeting} ${p.name}`,
    desc: `${p.tagline.map((l) => l.map((r) => r.t).join('')).join(' ')} ${p.facts.map((f) => `${f.label}: ${f.value}, ${f.detail}.`).join(' ')}`,
    css,
    body,
  });
}
