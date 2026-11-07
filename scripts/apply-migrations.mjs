import { existsSync, readFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

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

const env = { ...readEnv(envPath), ...process.env };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

if (!accessToken) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN in .env.local (Account -> Access Tokens).",
  );
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

async function runSql(query) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`SQL request failed (${response.status}): ${body}`);
  }

  return body ? JSON.parse(body) : [];
}

async function main() {
  await runSql(`
    create table if not exists public.applied_migrations (
      version text primary key,
      name text not null,
      applied_at timestamptz not null default now()
    );
  `);

  const migrationsDir = path.join(root, "supabase", "migrations");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = file.split("_")[0];
    const applied = await runSql(
      `select version from public.applied_migrations where version = '${version}';`,
    );

    if (Array.isArray(applied) && applied.length > 0) {
      console.log(`skip  ${file}`);
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    console.log(`apply ${file}`);

    await runSql(`
      ${sql}

      insert into public.applied_migrations (version, name)
      values ('${version}', '${file.replaceAll("'", "''")}');
    `);
  }

  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
