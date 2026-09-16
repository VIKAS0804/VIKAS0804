import { mkdir, writeFile } from "node:fs/promises";

const projects = [
  {
    name: "MoodSync",
    label: "Music intelligence",
    summary: "Mood scoring from real preview audio after Spotify restricted audio features.",
    stack: "FastAPI  •  React Native  •  PostgreSQL",
    color: "#8b5cf6",
  },
  {
    name: "TicketForge",
    label: "MLOps platform",
    summary: "AI assisted ticket assignment from ingest to monitoring and deployment.",
    stack: "Airflow  •  MLflow  •  GCP  •  Terraform",
    color: "#3b82f6",
  },
  {
    name: "ThinkStruct",
    label: "Patent search",
    summary: "Hybrid retrieval, reranking, fine tuning, and a plan for ten million patents.",
    stack: "Flask  •  Embeddings  •  pgvector",
    color: "#06b6d4",
  },
  {
    name: "Impulse Coach",
    label: "Fintech product",
    summary: "A mobile coach that turns spending patterns into useful nudges.",
    stack: "Expo  •  Plaid  •  Supabase",
    color: "#f97316",
  },
  {
    name: "IoT Sensor Dashboard",
    label: "Cloud and devices",
    summary: "Live shipment condition monitoring from MQTT through Cloud Run.",
    stack: "MQTT  •  Firestore  •  Pub Sub",
    color: "#10b981",
  },
  {
    name: "Tribunal",
    label: "Bitcoin systems",
    summary: "A Bitcoin native marketplace with HTLC escrow and on chain reputation.",
    stack: "Next.js  •  Bitcoin Script  •  PostgreSQL",
    color: "#f59e0b",
  },
];

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const cards = projects
  .map((project, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = column === 0 ? 28 : 492;
    const y = 112 + row * 132;
    return `
      <g>
        <rect x="${x}" y="${y}" width="440" height="112" rx="14" fill="#161b22" stroke="#30363d" />
        <rect x="${x}" y="${y}" width="6" height="112" rx="3" fill="${project.color}" />
        <circle cx="${x + 31}" cy="${y + 31}" r="12" fill="${project.color}" opacity="0.92" />
        <text x="${x + 54}" y="${y + 28}" class="name">${escapeXml(project.name)}</text>
        <text x="${x + 54}" y="${y + 48}" class="label" fill="${project.color}">${escapeXml(project.label)}</text>
        <text x="${x + 24}" y="${y + 76}" class="summary">${escapeXml(project.summary)}</text>
        <text x="${x + 24}" y="${y + 96}" class="stack">${escapeXml(project.stack)}</text>
      </g>`;
  })
  .join("\n");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="528" viewBox="0 0 960 528" role="img" aria-labelledby="title description">
  <title id="title">Featured work by Vikas Neriyanuru</title>
  <desc id="description">Six featured software projects spanning music intelligence, MLOps, patent search, fintech, IoT, and Bitcoin systems.</desc>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .name { fill: #f0f6fc; font-size: 18px; font-weight: 650; }
    .label { font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
    .summary { fill: #c9d1d9; font-size: 12px; }
    .stack { fill: #8b949e; font-size: 11px; }
  </style>
  <rect width="960" height="528" rx="16" fill="#0d1117" stroke="#30363d" />
  <circle cx="46" cy="45" r="7" fill="#58a6ff" />
  <text x="64" y="42" fill="#f0f6fc" font-size="23" font-weight="650">What I have been building</text>
  <text x="28" y="74" fill="#8b949e" font-size="14">Six projects across product engineering, cloud systems, and applied machine learning.</text>
  ${cards}
</svg>
`;

await mkdir("assets", { recursive: true });
await writeFile("assets/project-showcase.svg", svg, "utf8");
console.log("Rendered assets/project-showcase.svg.");
