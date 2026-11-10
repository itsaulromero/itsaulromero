// Activity data from the GitHub GraphQL API.
// Private work shows up as anonymous counts when "Include private contributions
// on my profile" is enabled in the GitHub profile settings.

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalPullRequestContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks { firstDay contributionDays { date contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
      nodes {
        name
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
      }
    }
  }
}`;

export async function fetchStats(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': `${login}-profile-readme`,
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub API answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  if (!json.data?.user) throw new Error(`GitHub API returned no user: ${JSON.stringify(json.errors ?? json).slice(0, 300)}`);
  return summarize(json.data.user, login);
}

export function summarize(user, login) {
  const cc = user.contributionsCollection;
  const weeks = cc.contributionCalendar.weeks.map((w) => ({
    start: w.firstDay,
    count: w.contributionDays.reduce((a, d) => a + d.contributionCount, 0),
  }));
  const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

  // The profile repository itself is a generator; it would skew the language mix.
  const langs = new Map();
  for (const repo of user.repositories?.nodes ?? []) {
    if (repo.name.toLowerCase() === login.toLowerCase()) continue;
    for (const e of repo.languages.edges) {
      langs.set(e.node.name, (langs.get(e.node.name) ?? 0) + e.size);
    }
  }

  return {
    total: cc.contributionCalendar.totalContributions,
    activeDays: days.filter((d) => d.contributionCount > 0).length,
    bestWeek: Math.max(0, ...weeks.map((w) => w.count)),
    prs: cc.totalPullRequestContributions ?? 0,
    reviews: cc.totalPullRequestReviewContributions ?? 0,
    weeks,
    languages: [...langs].map(([name, size]) => ({ name, size })).sort((a, b) => b.size - a.size),
    updated: new Date().toISOString().slice(0, 10),
  };
}
