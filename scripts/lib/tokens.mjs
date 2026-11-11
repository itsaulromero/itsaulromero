// Design tokens.
//
// Text colors follow GitHub's own, so open sections sit on the page like native type.
// One accent, blue: the name's accent mark, the glow, the main link, the request, the bars.
// One supporting color, green, kept for "it works" signals: 200 OK and what is live now.
// Brand colors only appear on technology icons.
export const THEMES = {
  dark: {
    name: 'dark',
    page: '#0d1117',
    card: '#0a0d12',
    raised: '#141a22',
    cardBorder: '#262c36',
    ink: '#f0f6fc',
    body: '#d1d7e0',
    muted: '#9198a1',
    faint: '#656c76',
    hairline: '#3d444d',
    accent: '#4c9aff',
    ok: '#3fb950',
    onAccent: '#06162e',
    glow: [0.24, 0.12],
  },
  light: {
    name: 'light',
    page: '#ffffff',
    card: '#fbfcfd',
    raised: '#ffffff',
    cardBorder: '#d1d9e0',
    ink: '#1f2328',
    body: '#393f46',
    muted: '#59636e',
    faint: '#818b98',
    hairline: '#d1d9e0',
    accent: '#0969da',
    ok: '#1a7f37',
    onAccent: '#ffffff',
    glow: [0.13, 0.07],
  },
};

export const WIDTH = 840;
