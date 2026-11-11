// Stack. The stations on the route are the path a request really takes:
// Frontend → Backend → Database. A request travels the line and wakes each station
// as it arrives; a green "200 OK" comes back. It loops every 8 seconds.
// A station marked "offRoute" (Deploy) is not on that path: it is what puts the
// rest in production, so it sits apart with a steady green "live" pulse.
import { WIDTH as W } from '../lib/tokens.mjs';
import { svgDoc, icon, brandColor } from '../lib/draw.mjs';
import { text, width } from '../lib/type.mjs';

const TRACK_Y = 64;
const NODE_X = 8; // node center, measured from the column's left edge
const ROW = 31;
const FIRST_ROW = 141;
const LOOP = 8; // seconds

export function stack(p, t) {
  const id = `st-${t.name}`;
  const stations = p.stack.stations;
  const route = stations.filter((s) => !s.offRoute);
  const colW = W / stations.length;
  const col = (s) => stations.indexOf(s) * colW;
  const node = (s) => col(s) + NODE_X;
  const first = node(route[0]);
  const last = node(route.at(-1));
  const span = last - first;
  const rows = Math.max(...stations.map((s) => s.items.length));
  const H = FIRST_ROW + (rows - 1) * ROW + 14;

  // Timeline, in % of the loop. The request rests at route station i until stops[i].
  const stops = route.map((_, i) => 8 + i * 22); // 8, 30, 52
  const arrive = (i) => (i === 0 ? 0 : stops[i] - 7);
  const end = stops.at(-1);
  const frac = (i) => i / (route.length - 1);

  // Track: a grey segment between route stations, then a short tail that fades out.
  const track = route
    .map((s, i) =>
      i < route.length - 1
        ? `<line x1="${node(s) + 11}" y1="${TRACK_Y}" x2="${node(route[i + 1]) - 11}" y2="${TRACK_Y}" stroke="${t.hairline}" stroke-width="2" stroke-linecap="round"/>`
        : `<line x1="${node(s) + 11}" y1="${TRACK_Y}" x2="${node(s) + 90}" y2="${TRACK_Y}" stroke="url(#${id}-tail)" stroke-width="2" stroke-linecap="round"/>`,
    )
    .join('');

  // Colored trails: the accent follows the request out, green follows the answer back.
  // They are clipped to the gaps between stations, so the rings stay clean.
  const gaps = route
    .slice(0, -1)
    .map((s, i) => `<rect x="${node(s) + 9}" y="${TRACK_Y - 3}" width="${node(route[i + 1]) - node(s) - 18}" height="6"/>`)
    .join('');
  const trails =
    `<g clip-path="url(#${id}-gaps)">` +
    `<line class="trail out" x1="${first}" y1="${TRACK_Y}" x2="${last}" y2="${TRACK_Y}" stroke="${t.accent}" stroke-width="2.5"/>` +
    `<line class="trail back" x1="${first}" y1="${TRACK_Y}" x2="${last}" y2="${TRACK_Y}" stroke="${t.ok}" stroke-width="2.5"/>` +
    `</g>`;

  const label = (str, x, fill, weight) => text(str, x, TRACK_Y - 18, { size: 11.5, weight, fill, anchor: 'middle' });

  const columns = stations
    .map((s) => {
      const x = col(s);
      const i = route.indexOf(s);
      const items = s.items
        .map((it, r) => {
          const y = FIRST_ROW + r * ROW;
          const opts = { size: 15.5, weight: 500 };
          const note = it.learning
            ? text('(learning)', x + 27 + width(it.name, opts) + 7, y, { size: 13, weight: 400, fill: t.muted })
            : '';
          const cls = i >= 0 ? ` class="item i${i}" style="animation-delay:${(r * 0.09).toFixed(2)}s"` : '';
          return `<g${cls}>${icon(it.icon, x, y - 13.5, 17, brandColor(it.icon, t))}${text(it.name, x + 27, y, { ...opts, fill: t.body })}${note}</g>`;
        })
        .join('');
      const marker =
        i >= 0
          ? `<circle class="ripple p${i}" cx="${node(s)}" cy="${TRACK_Y}" r="7" fill="none" stroke="${t.accent}" stroke-width="1.5"/>` +
            `<circle cx="${node(s)}" cy="${TRACK_Y}" r="7" fill="none" stroke="${t.ink}" stroke-width="2"/>` +
            `<circle class="on on${i}" cx="${node(s)}" cy="${TRACK_Y}" r="3.6" fill="${t.accent}"/>`
          : `<circle class="live" cx="${node(s)}" cy="${TRACK_Y}" r="7" fill="none" stroke="${t.ok}" stroke-width="1.5"/>` +
            `<circle cx="${node(s)}" cy="${TRACK_Y}" r="7" fill="none" stroke="${t.ok}" stroke-width="2"/>` +
            `<circle cx="${node(s)}" cy="${TRACK_Y}" r="3.6" fill="${t.ok}"/>` +
            (s.live ? text(s.live, node(s) + 16, TRACK_Y + 4, { size: 12, weight: 600, fill: t.ok }) : '');
      return (
        marker +
        text(s.name, x, 106, { size: 19, weight: 700, fill: t.ink }) +
        items
      );
    })
    .join('');

  const request = `<g class="rq"><circle cx="${first}" cy="${TRACK_Y}" r="17" fill="url(#${id}-glow)"/><circle cx="${first}" cy="${TRACK_Y}" r="5.5" fill="${t.accent}"/>${label('request', first + 14, t.muted, 500)}</g>`;
  const response = `<g class="rs"><circle cx="${last}" cy="${TRACK_Y}" r="15" fill="url(#${id}-okglow)"/><circle cx="${last}" cy="${TRACK_Y}" r="4.8" fill="${t.ok}"/>${label('200 OK', last + 12, t.ok, 700)}</g>`;

  const kf = [];
  // Request: move, rest, move… then vanish at the last station.
  kf.push(
    `@keyframes rq{${route.map((_, i) => `${arrive(i)}%,${stops[i]}%{transform:translateX(${span * frac(i)}px);opacity:1}`).join('')}${end + 3}%{transform:translateX(${span}px);opacity:0}96%{transform:translateX(0);opacity:0}100%{transform:translateX(0);opacity:1}}`,
  );
  // Response: appears at the last station and travels back to the first.
  kf.push(
    `@keyframes rs{0%,${end}%{transform:translateX(0);opacity:0}${end + 3}%{transform:translateX(0);opacity:1}88%{transform:translateX(${-span}px);opacity:1}93%,100%{transform:translateX(${-span}px);opacity:0}}`,
  );
  // Trails grow with their dot, then fade together.
  kf.push(
    `@keyframes out{${route.map((_, i) => `${arrive(i)}%,${stops[i]}%{transform:scaleX(${frac(i)});opacity:1}`).join('')}88%{transform:scaleX(1);opacity:1}94%,99.9%{transform:scaleX(1);opacity:0}100%{transform:scaleX(0);opacity:1}}`,
  );
  kf.push(`@keyframes back{0%,${end + 3}%{transform:scaleX(0);opacity:1}88%{transform:scaleX(1);opacity:1}94%,100%{transform:scaleX(1);opacity:0}}`);
  // Each route station lights, ripples and nudges its items when the request arrives.
  route.forEach((_, i) => {
    const a = arrive(i);
    kf.push(
      i === 0
        ? `@keyframes on0{0%,9%{opacity:1}13%,86%{opacity:0}89%,100%{opacity:1}}`
        : `@keyframes on${i}{0%,${a - 2}%{opacity:0}${a}%,${stops[i] + 1}%{opacity:1}${stops[i] + 5}%,100%{opacity:0}}`,
    );
    const b = i === 0 ? 0.5 : a;
    kf.push(`@keyframes p${i}{0%,${b}%{transform:scale(1);opacity:0}${b + 0.5}%{transform:scale(1);opacity:.9}${b + 10}%,100%{transform:scale(3);opacity:0}}`);
    kf.push(`@keyframes i${i}{0%,${b}%{transform:translateX(0)}${b + 3}%{transform:translateX(7px)}${b + 8}%,100%{transform:translateX(0)}}`);
  });

  const css = `
.rq{animation:rq ${LOOP}s cubic-bezier(.65,0,.35,1) infinite}
.rs{opacity:0;animation:rs ${LOOP}s cubic-bezier(.65,0,.35,1) infinite}
.trail{transform:scaleX(0)}
.out{transform-origin:${first}px ${TRACK_Y}px;animation:out ${LOOP}s cubic-bezier(.65,0,.35,1) infinite}
.back{transform-origin:${last}px ${TRACK_Y}px;animation:back ${LOOP}s cubic-bezier(.65,0,.35,1) infinite}
.on{opacity:0}
.on0{opacity:1}
.ripple{opacity:0;transform-box:fill-box;transform-origin:50% 50%}
.live{opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:live 2.4s ease-out infinite}
${route.map((_, i) => `.on${i}{animation:on${i} ${LOOP}s linear infinite}.p${i}{animation:p${i} ${LOOP}s ease-out infinite}.i${i}{animation:i${i} ${LOOP}s ease-in-out infinite}`).join('\n')}
@keyframes live{from{transform:scale(1);opacity:.9}to{transform:scale(2.8);opacity:0}}
${kf.join('\n')}`;

  const defs = `
<clipPath id="${id}-gaps">${gaps}</clipPath>
<linearGradient id="${id}-tail" gradientUnits="userSpaceOnUse" x1="${last}" x2="${last + 90}" y1="0" y2="0"><stop offset="0" stop-color="${t.hairline}"/><stop offset="1" stop-color="${t.hairline}" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}-glow"><stop offset="0" stop-color="${t.accent}" stop-opacity=".5"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-okglow"><stop offset="0" stop-color="${t.ok}" stop-opacity=".5"/><stop offset="1" stop-color="${t.ok}" stop-opacity="0"/></radialGradient>`;

  const body = `
${text(p.stack.title, 0, 20, { size: 15, weight: 500, fill: t.muted })}
${track}
${trails}
${columns}
${response}
${request}`;

  return svgDoc({
    width: W,
    height: H,
    title: 'Stack',
    desc: `${p.stack.title}. ${stations.map((s) => `${s.name}: ${s.items.map((it) => it.name + (it.learning ? ' (learning)' : '')).join(', ')}`).join('. ')}.`,
    css,
    defs,
    body,
  });
}
