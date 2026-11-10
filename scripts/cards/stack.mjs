// Stack, drawn as the route a request takes: Interface → API → Data → Ship.
// A request travels the line and a "200 OK" comes back, on a loop.
import { WIDTH as W } from '../lib/tokens.mjs';
import { svgDoc, icon } from '../lib/draw.mjs';
import { text, width } from '../lib/type.mjs';

const TRACK_Y = 64;
const NODE_X = 8; // node center, measured from the column's left edge
const ROW = 31;
const FIRST_ROW = 162;

export function stack(p, t) {
  const id = `st-${t.name}`;
  const stations = p.stack.stations;
  const colW = W / stations.length;
  const cols = stations.map((_, i) => i * colW);
  const node = (i) => cols[i] + NODE_X;
  const span = node(stations.length - 1) - node(0);
  const rows = Math.max(...stations.map((s) => s.items.length));
  const H = FIRST_ROW + (rows - 1) * ROW + 14;

  // Track: one segment between each pair of stations, then a tail that fades out.
  const track = stations
    .map((_, i) =>
      i < stations.length - 1
        ? `<line x1="${node(i) + 11}" y1="${TRACK_Y}" x2="${node(i + 1) - 11}" y2="${TRACK_Y}" stroke="${t.hairline}" stroke-width="2" stroke-linecap="round"/>`
        : `<line x1="${node(i) + 11}" y1="${TRACK_Y}" x2="${W - 4}" y2="${TRACK_Y}" stroke="url(#${id}-tail)" stroke-width="2" stroke-linecap="round"/>`,
    )
    .join('');

  const columns = stations
    .map((s, i) => {
      const x = cols[i];
      const items = s.items
        .map((it, r) => {
          const y = FIRST_ROW + r * ROW;
          const opts = { size: 15.5, weight: 500 };
          const note = it.learning
            ? text('(learning)', x + 27 + width(it.name, opts) + 7, y, { size: 13, weight: 400, fill: t.muted })
            : '';
          return `<g fill="${t.body}">${icon(it.icon, x, y - 13.5, 17)}${text(it.name, x + 27, y, opts)}</g>${note}`;
        })
        .join('');
      return (
        `<circle cx="${node(i)}" cy="${TRACK_Y}" r="7" fill="none" stroke="${t.ink}" stroke-width="2"/>` +
        `<circle class="on on${i}" cx="${node(i)}" cy="${TRACK_Y}" r="3.6" fill="${t.accent}"/>` +
        text(s.name, x, 106, { size: 19, weight: 700, fill: t.ink }) +
        text(s.note, x, 127, { size: 13.5, weight: 400, fill: t.muted }) +
        items
      );
    })
    .join('');

  const label = (str, x, fill, weight) => text(str, x, TRACK_Y - 18, { size: 11.5, weight, fill, anchor: 'middle' });
  const request = `<g class="rq"><circle cx="${node(0)}" cy="${TRACK_Y}" r="17" fill="url(#${id}-glow)"/><circle cx="${node(0)}" cy="${TRACK_Y}" r="5.5" fill="${t.accent}"/>${label('request', node(0) + 14, t.muted, 500)}</g>`;
  const last = node(stations.length - 1);
  const response = `<g class="rs"><circle cx="${last}" cy="${TRACK_Y}" r="4.6" fill="${t.ink}"/>${label('200 OK', last + 12, t.ink, 600)}</g>`;

  // Timeline of one loop, in % of 9s: the request stops at each station, then the response returns.
  const stops = stations.map((_, i) => 7 + i * 18); // arrival-and-rest ends: 7, 25, 43, 61
  const rq = stations
    .map((_, i) => {
      const x = `${(span * i) / (stations.length - 1)}px`;
      const arrive = i === 0 ? 0 : stops[i] - 6;
      return `${arrive}%,${stops[i]}%{transform:translateX(${x});opacity:1}`;
    })
    .join('');
  const end = stops.at(-1);
  const lit = stations
    .map((_, i) => {
      if (i === 0) return `@keyframes ${id}-on0{0%,8%{opacity:1}12%,88%{opacity:0}91%,100%{opacity:1}}`;
      const a = stops[i] - 6;
      return `@keyframes ${id}-on${i}{0%,${a - 2}%{opacity:0}${a}%,${stops[i] + 1}%{opacity:1}${stops[i] + 5}%,100%{opacity:0}}`;
    })
    .join('\n');

  const css = `
.rq{animation:${id}-rq 9s cubic-bezier(.65,0,.35,1) infinite}
.rs{opacity:0;animation:${id}-rs 9s cubic-bezier(.65,0,.35,1) infinite}
.on{opacity:0}
.on0{opacity:1}
${stations.map((_, i) => `.on${i}{animation:${id}-on${i} 9s linear infinite}`).join('\n')}
@keyframes ${id}-rq{${rq}${end + 3}%{transform:translateX(${span}px);opacity:0}96%{transform:translateX(0);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes ${id}-rs{0%,${end}%{transform:translateX(0);opacity:0}${end + 3}%{transform:translateX(0);opacity:1}90%{transform:translateX(${-span}px);opacity:1}94%,100%{transform:translateX(${-span}px);opacity:0}}
${lit}`;

  const defs = `
<linearGradient id="${id}-tail" gradientUnits="userSpaceOnUse" x1="${last}" x2="${W - 4}" y1="0" y2="0"><stop offset="0" stop-color="${t.hairline}"/><stop offset="1" stop-color="${t.hairline}" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}-glow"><stop offset="0" stop-color="${t.accent}" stop-opacity=".5"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>`;

  const body = `
${text(p.stack.title, 0, 20, { size: 15, weight: 500, fill: t.muted })}
${track}
${columns}
${response}
${request}`;

  return svgDoc({
    width: W,
    height: H,
    title: 'Stack',
    desc: `${p.stack.title}. ${stations.map((s) => `${s.name} (${s.note}): ${s.items.map((it) => it.name + (it.learning ? ' (learning)' : '')).join(', ')}`).join('. ')}.`,
    css,
    defs,
    body,
  });
}
