// Activity: one sentence with the numbers, a year of weekly bars and the languages.
// The current week is the only marigold bar, and it pulses.
import { WIDTH as W } from '../lib/tokens.mjs';
import { svgDoc } from '../lib/draw.mjs';
import { text, inline, width } from '../lib/type.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (n) => Number(n).toLocaleString('en-US');
const plural = (n, one, many) => (n === 1 ? one : many);
const SHADES = [1, 0.66, 0.46, 0.32, 0.22, 0.15];
const CHART_W = W - 14; // room on the right for the pulse of the current week

export function activity(s, t, note = '') {
  const id = `ac-${t.name}`;
  const parts = [];
  const strong = (v) => ({ t: fmt(v), weight: 700, fill: t.ink });
  const plain = (str) => ({ t: str, fill: t.muted });

  // Sentence
  let y = 24;
  const runs = [strong(s.total), plain(` ${plural(s.total, 'contribution', 'contributions')} in the last year.`)];
  if (s.bestWeek > 0) runs.push(plain(' Busiest week: '), strong(s.bestWeek), plain('.'));
  parts.push(inline(runs, 0, y, { size: 18, weight: 400 }).svg);

  // Second line: a note from data/profile.json, or pull requests and reviews when the API reports them.
  const second = [];
  if (note) {
    second.push(plain(note));
  } else {
    if (s.prs > 0) second.push(strong(s.prs), plain(` ${plural(s.prs, 'pull request', 'pull requests')} opened`));
    if (s.reviews > 0) second.push(...(second.length ? [plain(' and ')] : []), strong(s.reviews), plain(` code ${plural(s.reviews, 'review', 'reviews')}`));
    if (second.length) second.push(plain(' in public repositories.'));
  }
  if (second.length) {
    y += 27;
    parts.push(inline(second, 0, y, { size: 15.5, weight: 400 }).svg);
  }

  // Weekly bars
  const top = y + 30;
  const height = 122;
  const base = top + height;
  const n = s.weeks.length;
  const pitch = CHART_W / n;
  const bw = Math.min(11, pitch - 5);
  const max = Math.max(1, ...s.weeks.map((w) => w.count));
  const barTop = (c) => base - Math.max(4, (c / max) * (height - 22));
  const cx = (i) => i * pitch + pitch / 2;
  const peak = s.weeks.findIndex((w) => w.count === max);

  s.weeks.forEach((w, i) => {
    const x = (cx(i) - bw / 2).toFixed(2);
    const live = i === n - 1;
    if (w.count === 0) {
      parts.push(`<rect x="${x}" y="${base - 3}" width="${bw.toFixed(2)}" height="3" rx="1.5" fill="${live ? t.accent : t.hairline}"/>`);
      return;
    }
    const yb = barTop(w.count);
    parts.push(
      `<rect class="bar" style="animation-delay:${(0.2 + i * 0.016).toFixed(3)}s" x="${x}" y="${yb.toFixed(2)}" width="${bw.toFixed(2)}" height="${(base - yb).toFixed(2)}" rx="${Math.min(3, bw / 2)}" fill="${live ? t.accent : t.ink}"${live ? '' : ' fill-opacity=".86"'}/>`,
    );
  });
  if (s.weeks[peak].count > 0 && peak !== n - 1) {
    parts.push(text(fmt(max), cx(peak), barTop(max) - 8, { size: 12, weight: 600, fill: t.muted, anchor: 'middle' }));
  }
  const liveY = s.weeks[n - 1].count > 0 ? barTop(s.weeks[n - 1].count) : base - 3;
  parts.push(`<circle class="pulse" cx="${cx(n - 1).toFixed(2)}" cy="${liveY.toFixed(2)}" r="4" fill="none" stroke="${t.accent}" stroke-width="1.6"/>`);

  // Month labels, at the first week of each month
  let lastMonth = -1;
  let lastX = -100;
  s.weeks.forEach((w, i) => {
    const m = new Date(`${w.start}T00:00:00Z`).getUTCMonth();
    const x = i * pitch + (pitch - bw) / 2;
    if (m !== lastMonth && i > 0 && x - lastX > 40 && x < CHART_W - 30) {
      parts.push(text(MONTHS[m], x, base + 21, { size: 12.5, weight: 400, fill: t.muted }));
      lastX = x;
    }
    lastMonth = m;
  });

  // Languages
  y = base + 62;
  const updated = new Date(`${s.updated}T00:00:00Z`);
  const stamp = `Updated ${MONTHS[updated.getUTCMonth()]} ${updated.getUTCDate()}, ${updated.getUTCFullYear()}`;
  const langs = s.languages.slice(0, 6);
  if (langs.length) {
    const total = langs.reduce((a, l) => a + l.size, 0) || 1;
    parts.push(text('Languages in my public repositories', 0, y, { size: 13.5, weight: 500, fill: t.muted }));
    parts.push(text(stamp, W, y, { size: 13.5, weight: 400, fill: t.faint, anchor: 'end' }));
    y += 14;
    parts.push(`<clipPath id="${id}-clip"><rect x="0" y="${y}" width="${W}" height="8" rx="4"/></clipPath><g clip-path="url(#${id}-clip)">`);
    let bx = 0;
    langs.forEach((l, i) => {
      const w = (l.size / total) * W;
      parts.push(`<rect x="${bx.toFixed(2)}" y="${y}" width="${Math.max(0, w - 2).toFixed(2)}" height="8" fill="${t.ink}" fill-opacity="${SHADES[i]}"/>`);
      bx += w;
    });
    parts.push('</g>');
    y += 33;
    let lx = 0;
    langs.forEach((l, i) => {
      const pct = `${Math.round((l.size / total) * 100)}%`;
      const name = { size: 14, weight: 600 };
      const num = { size: 14, weight: 400 };
      parts.push(
        `<rect x="${lx}" y="${y - 10}" width="10" height="10" rx="3" fill="${t.ink}" fill-opacity="${SHADES[i]}"/>` +
          text(l.name, lx + 17, y, { ...name, fill: t.ink }) +
          text(pct, lx + 17 + width(l.name, name) + 6, y, { ...num, fill: t.muted }),
      );
      lx += 17 + width(l.name, name) + 6 + width(pct, num) + 26;
    });
  } else {
    parts.push(text(stamp, W, y, { size: 13.5, weight: 400, fill: t.faint, anchor: 'end' }));
  }
  const H = y + 10;

  const css = `
.bar{transform-box:fill-box;transform-origin:50% 100%;animation:grow .7s cubic-bezier(.2,.8,.2,1) both}
.pulse{transform-box:fill-box;transform-origin:50% 50%;animation:pulse 2.4s ease-out 1.4s infinite}
@keyframes grow{from{transform:scaleY(0)}}
@keyframes pulse{from{transform:scale(1);opacity:.9}to{transform:scale(3);opacity:0}}`;

  return svgDoc({
    width: W,
    height: H,
    title: 'GitHub activity over the last year',
    desc: `${fmt(s.total)} contributions in the last year. Busiest week: ${s.bestWeek}.${note ? ` ${note}` : ''}${langs.length ? ` Languages: ${langs.map((l) => l.name).join(', ')}.` : ''} ${stamp}.`,
    css,
    body: parts.join('\n'),
  });
}
