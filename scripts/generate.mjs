#!/usr/bin/env node
// Renders the profile cards as SVG, once per theme, into ./assets.
//
//   GITHUB_TOKEN=... npm run generate        all cards, live activity
//   npm run generate                         hero, links and stack only
//   STATS_FILE=stats.json npm run generate   activity from a saved JSON (offline preview)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { THEMES } from './lib/tokens.mjs';
import { fetchStats } from './lib/github.mjs';
import { hero } from './cards/hero.mjs';
import { stack } from './cards/stack.mjs';
import { link } from './cards/link.mjs';
import { activity } from './cards/activity.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const profile = JSON.parse(await readFile(join(root, 'data/profile.json'), 'utf8'));

async function write(render) {
  for (const t of Object.values(THEMES)) {
    const dir = join(root, 'assets', t.name);
    await mkdir(dir, { recursive: true });
    for (const [name, svg] of Object.entries(render(t))) await writeFile(join(dir, name), svg);
  }
}

// 1. Cards that only depend on data/profile.json.
await write((t) => ({
  'hero.svg': hero(profile, t),
  'stack.svg': stack(profile, t),
  ...Object.fromEntries(profile.links.map((l) => [`link-${l.id}.svg`, link(l, t)])),
}));
console.log('✓ hero, stack and links');

// 2. Activity, from the GitHub API. If it fails, the previous card stays in place.
const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
try {
  let stats = null;
  if (process.env.STATS_FILE) stats = JSON.parse(await readFile(process.env.STATS_FILE, 'utf8'));
  else if (token) stats = await fetchStats(profile.login, token);

  if (stats) {
    await write((t) => ({ 'activity.svg': activity(stats, t) }));
    console.log(`✓ activity (${stats.total} contributions)`);
  } else {
    console.warn('! No GITHUB_TOKEN: activity card skipped. The GitHub Action renders it.');
  }
} catch (err) {
  console.error(`✗ activity: ${err.message}`);
  process.exitCode = 1;
}
