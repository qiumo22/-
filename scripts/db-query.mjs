import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readEnv(file) {
  if (!existsSync(file)) return {};

  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = { ...readEnv(path.join(root, ".env.local")), ...process.env };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = env.SUPABASE_ACCESS_TOKEN;
const sql = process.argv.slice(2).join(" ");

if (!supabaseUrl || !accessToken) {
  console.error("Missing Supabase URL or access token in .env.local");
  process.exit(1);
}

if (!sql) {
  console.error('Usage: npm run db:query -- "select 1;"');
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const body = await response.text();

if (!response.ok) {
  console.error(`HTTP ${response.status}: ${body}`);
  process.exit(1);
}

console.log(body);
