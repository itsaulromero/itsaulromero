// Activity card: one sentence with the numbers, a year of weekly bars and the languages.
// Bars use the accent. The current week is green and pulses (it is live),
// and a soft wave runs through the bars every few seconds.
import { WIDTH as W } from '../lib/tokens.mjs';
import { svgDoc, card } from '../lib/draw.mjs';
import { text, inline, width } from '../lib/type.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (n) => Number(n).toLocaleString('en-US');
const plural = (n, one, many) => (n === 1 ? one : many);
const PAD = 40;
const INNER = W - 2 * PAD;
const CHART_W = INNER - 12; // room on the right for the pulse of the current week

export function activity(s, t) {
  const id = `ac-${t.name}`;
  const parts = [];
  const strong = (v) => ({ t: fmt(v), weight: 700, fill: t.ink });
  const plain = (str) => ({ t: str, fill: t.muted });

  // Sentence
  let y = 58;
  const runs = [strong(s.total), plain(` ${plural(s.total, 'contribution', 'contributions')} in the last year.`)];
  parts.push(inline(runs, PAD, y, { size: 18, weight: 400 }).svg);

  // Weekly bars
  const top = y + 34;
  const height = 122;
  const base = top + height;
  const n = s.weeks.length;
  const pitch = CHART_W / n;
  const bw = Math.min(11, pitch - 4.5);
  const max = Math.max(1, ...s.weeks.map((w) => w.count));
  const barTop = (c) => base - Math.max(4, (c / max) * (height - 22));
  const cx = (i) => PAD + i * pitch + pitch / 2;
  const peak = s.weeks.findIndex((w) => w.count === max);

  let k = 0;
  s.weeks.forEach((w, i) => {
    const x = (cx(i) - bw / 2).toFixed(2);
    const live = i === n - 1;
    if (w.count === 0) {
      parts.push(`<rect x="${x}" y="${base - 3}" width="${bw.toFixed(2)}" height="3" rx="1.5" fill="${live ? t.ok : t.hairline}"/>`);
      return;
    }
    const yb = barTop(w.count);
    parts.push(
      `<rect class="bar${live ? '' : ' wave'}" style="animation-delay:${(0.2 + k * 0.05).toFixed(2)}s,${(2 + k * 0.09).toFixed(2)}s" x="${x}" y="${yb.toFixed(2)}" width="${bw.toFixed(2)}" height="${(base - yb).toFixed(2)}" rx="${Math.min(3, bw / 2).toFixed(2)}" fill="${live ? t.ok : t.accent}"/>`,
    );
    k++;
  });
  if (s.weeks[peak].count > 0 && peak !== n - 1) {
    parts.push(text(fmt(max), cx(peak), barTop(max) - 8, { size: 12, weight: 600, fill: t.muted, anchor: 'middle' }));
  }
  const liveY = s.weeks[n - 1].count > 0 ? barTop(s.weeks[n - 1].count) : base - 1.5;
  parts.push(`<circle class="pulse" cx="${cx(n - 1).toFixed(2)}" cy="${liveY.toFixed(2)}" r="4" fill="none" stroke="${t.ok}" stroke-width="1.6"/>`);

  // Month labels, at the first week of each month
  let lastMonth = -1;
  let lastX = -100;
  s.weeks.forEach((w, i) => {
    const m = new Date(`${w.start}T00:00:00Z`).getUTCMonth();
    const x = cx(i) - bw / 2;
    if (m !== lastMonth && i > 0 && x - lastX > 40 && x < PAD + CHART_W - 30) {
      parts.push(text(MONTHS[m], x, base + 21, { size: 12.5, weight: 400, fill: t.muted }));
      lastX = x;
    }
    lastMonth = m;
  });

  // Languages, in GitHub's own language colors
  y = base + 62;
  const updated = new Date(`${s.updated}T00:00:00Z`);
  const stamp = `Updated ${MONTHS[updated.getUTCMonth()]} ${updated.getUTCDate()}, ${updated.getUTCFullYear()}`;
  const langs = s.languages.slice(0, 6);
  const color = (l) => l.color || t.faint;
  if (langs.length) {
    const total = langs.reduce((a, l) => a + l.size, 0) || 1;
    parts.push(text('Languages in my public repositories', PAD, y, { size: 13.5, weight: 500, fill: t.muted }));
    parts.push(text(stamp, W - PAD, y, { size: 13.5, weight: 400, fill: t.faint, anchor: 'end' }));
    y += 14;
    parts.push(`<clipPath id="${id}-clip"><rect x="${PAD}" y="${y}" width="${INNER}" height="8" rx="4"/></clipPath><g clip-path="url(#${id}-clip)"><g class="langs">`);
    let bx = PAD;
    langs.forEach((l) => {
      const w = (l.size / total) * INNER;
      parts.push(`<rect x="${bx.toFixed(2)}" y="${y}" width="${Math.max(0, w - 2).toFixed(2)}" height="8" fill="${color(l)}"/>`);
      bx += w;
    });
    parts.push('</g></g>');
    y += 33;
    let lx = PAD;
    langs.forEach((l) => {
      const pct = `${Math.round((l.size / total) * 100)}%`;
      const name = { size: 14, weight: 600 };
      const num = { size: 14, weight: 400 };
      parts.push(
        `<circle cx="${lx + 5}" cy="${y - 5}" r="5" fill="${color(l)}"/>` +
          text(l.name, lx + 17, y, { ...name, fill: t.ink }) +
          text(pct, lx + 17 + width(l.name, name) + 6, y, { ...num, fill: t.muted }),
      );
      lx += 17 + width(l.name, name) + 6 + width(pct, num) + 26;
    });
  } else {
    parts.push(text(stamp, W - PAD, y, { size: 13.5, weight: 400, fill: t.faint, anchor: 'end' }));
  }
  const H = y + 34;

  const css = `
.bar{transform-box:fill-box;transform-origin:50% 100%;animation:grow .7s cubic-bezier(.2,.8,.2,1) both}
.wave{fill-opacity:.78;animation:grow .7s cubic-bezier(.2,.8,.2,1) both,wave 7s ease-in-out infinite}
.pulse{transform-box:fill-box;transform-origin:50% 50%;animation:pulse 2.4s ease-out 1.4s infinite}
.langs{transform-box:fill-box;transform-origin:0 50%;animation:growx 1.2s cubic-bezier(.2,.8,.2,1) .5s both}
.g1{animation:breathe 9s ease-in-out infinite}
.g2{animation:breathe 11s ease-in-out -4s infinite}
@keyframes breathe{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes grow{from{transform:scaleY(0)}}
@keyframes growx{from{transform:scaleX(0)}}
@keyframes wave{0%,14%,100%{fill-opacity:.78}7%{fill-opacity:1}}
@keyframes pulse{from{transform:scale(1);opacity:.9}to{transform:scale(3);opacity:0}}`;

  // Same soft blue glow as the hero card, so the two cards read as a pair.
  const glow = `<rect class="g1" width="${W}" height="${H}" fill="url(#${id}-g1)"/><rect class="g2" width="${W}" height="${H}" fill="url(#${id}-g2)"/>`;
  const frame = card(t, id, W, H, glow);
  const glowDefs =
    `<radialGradient id="${id}-g1" gradientUnits="userSpaceOnUse" cx="90" cy="-20" r="430"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow[0]}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id}-g2" gradientUnits="userSpaceOnUse" cx="${W - 40}" cy="${H + 30}" r="420"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow[1]}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>`;
  return svgDoc({
    width: W,
    height: H,
    title: 'GitHub activity over the last year',
    desc: `${fmt(s.total)} contributions in the last year.${langs.length ? ` Languages: ${langs.map((l) => l.name).join(', ')}.` : ''} ${stamp}.`,
    css,
    defs: frame.defs + glowDefs,
    body: frame.body + parts.join('\n'),
  });
}
