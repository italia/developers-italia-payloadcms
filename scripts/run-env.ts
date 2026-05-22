import dotenv from "dotenv";
import { spawnSync } from "node:child_process";

const mode = process.argv[2];
const command = process.argv[3];

if (!mode || !command) {
  console.error("Usage: bun run <staging|production> -- <dev|build>");
  process.exit(1);
}

const envFile = `.env.${mode}`;
dotenv.config({ path: envFile, override: true });

const payloadUrl = process.env.PAYLOAD_URL;
const payloadApiKey = process.env.PAYLOAD_API_KEY;

if (!payloadUrl || !payloadApiKey) {
  console.error(
    `Missing required env vars: PAYLOAD_URL and PAYLOAD_API_KEY must be set in ${envFile}`,
  );
  process.exit(1);
}

const linksResult = spawnSync("bun", ["./scripts/generate-link-map.ts"], {
  stdio: "inherit",
  env: process.env,
});
if (linksResult.status !== 0) {
  process.exit(linksResult.status ?? 1);
}

const astroResult = spawnSync(
  "bun",
  ["x", "astro", command, "--mode", mode, ...process.argv.slice(4)],
  { stdio: "inherit", env: process.env },
);

process.exit(astroResult.status ?? 1);
