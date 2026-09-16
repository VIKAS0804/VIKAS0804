import { mkdir, writeFile } from "node:fs/promises";

const login = process.env.GITHUB_LOGIN || "VIKAS0804";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!token) {
  throw new Error("Set GITHUB_TOKEN or GH_TOKEN before rendering the snapshot.");
}

const to = new Date();
const from = new Date(to);
from.setUTCFullYear(from.getUTCFullYear() - 1);

const query = `
  query ProfileActivity($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": `${login}-profile-snapshot`,
  },
  body: JSON.stringify({
    query,
    variables: {
      login,
      from: from.toISOString(),
      to: to.toISOString(),
    },
  }),
});

if (!response.ok) {
  throw new Error(`GitHub returned ${response.status}: ${await response.text()}`);
}

const payload = await response.json();
if (payload.errors?.length) {
  throw new Error(payload.errors.map((error) => error.message).join("; "));
}

const collection = payload.data.user.contributionsCollection;
const weeks = collection.contributionCalendar.weeks;
const days = weeks
  .flatMap((week) => week.contributionDays)
  .sort((left, right) => left.date.localeCompare(right.date));

const activeDays = days.filter((day) => day.contributionCount > 0).length;
let longestStreak = 0;
let runningStreak = 0;

for (const day of days) {
  if (day.contributionCount > 0) {
    runningStreak += 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  } else {
    runningStreak = 0;
  }
}

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const colors = ["#21262d", "#0e4429", "#006d32", "#26a641", "#39d353"];
const contributionLevel = (count) => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 7) return 3;
  return 4;
};

const cell = 11;
const gap = 3;
const gridX = 166;
const gridY = 116;
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabels = [];
let previousMonth = null;

for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
  const firstDay = weeks[weekIndex].contributionDays[0];
  if (!firstDay) continue;
  const month = new Date(`${firstDay.date}T00:00:00Z`).getUTCMonth();
  if (month !== previousMonth) {
    monthLabels.push({ month, weekIndex });
    previousMonth = month;
  }
}

const rectangles = weeks
  .flatMap((week, weekIndex) =>
    week.contributionDays.map((day) => {
      const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
      const x = gridX + weekIndex * (cell + gap);
      const y = gridY + weekday * (cell + gap);
      const label = `${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}`;
      return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${colors[contributionLevel(day.contributionCount)]}"><title>${escapeXml(label)}</title></rect>`;
    }),
  )
  .join("\n    ");

const labels = monthLabels
  .map(({ month, weekIndex }) => {
    const x = gridX + weekIndex * (cell + gap);
    return `<text x="${x}" y="104" class="muted small">${monthNames[month]}</text>`;
  })
  .join("\n    ");

const updated = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(to);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="244" viewBox="0 0 960 244" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(login)} GitHub activity</title>
  <desc id="description">${collection.contributionCalendar.totalContributions} contributions during the past year across ${activeDays} active days.</desc>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f0f6fc; }
    .muted { fill: #8b949e; }
    .small { font-size: 11px; }
    .stat { font-size: 13px; }
    .value { font-size: 23px; font-weight: 650; }
  </style>
  <rect width="960" height="244" rx="14" fill="#0d1117" stroke="#30363d" />
  <text x="28" y="40" font-size="20" font-weight="650">GitHub activity</text>
  <text x="28" y="62" class="muted stat">A live view of the past twelve months</text>

  <text x="28" y="104" class="value">${collection.contributionCalendar.totalContributions}</text>
  <text x="28" y="123" class="muted stat">contributions</text>
  <text x="28" y="158" class="value">${activeDays}</text>
  <text x="28" y="177" class="muted stat">active days</text>
  <text x="28" y="212" class="value">${longestStreak}</text>
  <text x="28" y="231" class="muted stat">day longest streak</text>

  ${labels}
  <text x="140" y="128" class="muted small" text-anchor="end">Mon</text>
  <text x="140" y="156" class="muted small" text-anchor="end">Wed</text>
  <text x="140" y="184" class="muted small" text-anchor="end">Fri</text>
  <g>
    ${rectangles}
  </g>

  <text x="166" y="229" class="muted small">${collection.totalCommitContributions} commits  •  ${collection.totalPullRequestContributions} pull requests  •  ${collection.totalIssueContributions} issues  •  ${collection.totalPullRequestReviewContributions} reviews</text>
  <text x="932" y="229" class="muted small" text-anchor="end">Updated ${escapeXml(updated)}</text>
</svg>
`;

await mkdir("assets", { recursive: true });
await writeFile("assets/github-snapshot.svg", svg, "utf8");
console.log(`Rendered assets/github-snapshot.svg for ${login}.`);
