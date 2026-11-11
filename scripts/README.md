# How this profile is built

Every image in the profile README is an SVG rendered by `scripts/generate.mjs`.

```
data/profile.json ─┐
                   ├─► scripts/generate.mjs ─► assets/{dark,light}/*.svg ─► README.md
GitHub GraphQL ────┘            ▲
                                └── GitHub Actions, every day and on every push
```

- **Change the content**: edit `data/profile.json` (name, sentence, facts, links, stack, activity note) and push. The Action re-renders the cards.
- **Change the look**: colors live in `scripts/lib/tokens.mjs`; each card has its own file in `scripts/cards/`.
- **Color**: one accent (blue) for the name, the main link, the request and the bars; green only for "it works" signals (200 OK, what is live). Icons use their brand color, adjusted to read in each theme.
- **Type**: text is converted to outlines with Mona Sans, so it looks the same on every device.
- **Motion**: plain CSS animations inside the SVG, switched off for people who prefer reduced motion.
- **Themes**: each card is rendered twice and the README picks one with `<picture>` and `prefers-color-scheme`.

## Run it locally

```bash
npm ci
GITHUB_TOKEN=<token> npm run generate   # every card
npm run generate                        # everything except the activity card
```
