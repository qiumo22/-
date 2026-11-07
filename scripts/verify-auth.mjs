import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = "Campus123456!";
const email = `verify+${Date.now()}@example.com`;
let userId = null;
let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function signIn() {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Sign in failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function main() {
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "验证用户" },
    });

  if (createError) throw createError;
  userId = created.user.id;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, username, display_name, role, status")
    .eq("id", userId)
    .single();

  check(
    "registration creates a profile automatically",
    !profileError &&
      profile?.id === userId &&
      /^[a-zA-Z0-9_-]{3,30}$/.test(profile.username) &&
      profile.role === "author" &&
      profile.status === "active",
    JSON.stringify(profileError ?? profile),
  );

  const token = await signIn();

  const updateResponse = await fetch(
    `${url}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "PATCH",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ display_name: "验证用户二号" }),
    },
  );
  const updated = await updateResponse.json();

  check(
    "user can update their own profile",
    updateResponse.ok && updated[0]?.display_name === "验证用户二号",
    JSON.stringify(updated),
  );

  const duplicateResponse = await fetch(
    `${url}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "PATCH",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ username: "lin_xia" }),
    },
  );
  const duplicate = await duplicateResponse.json();

  check(
    "duplicate usernames are rejected",
    !duplicateResponse.ok && duplicate.code === "23505",
    `HTTP ${duplicateResponse.status} ${JSON.stringify(duplicate)}`,
  );

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const avatarPath = `${userId}/verify.png`;

  const uploadResponse = await fetch(
    `${url}/storage/v1/object/avatars/${avatarPath}`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: png,
    },
  );

  check(
    "user can upload their own avatar",
    uploadResponse.ok,
    `HTTP ${uploadResponse.status} ${await uploadResponse.text()}`,
  );

  const publicResponse = await fetch(
    `${url}/storage/v1/object/public/avatars/${avatarPath}`,
  );

  check(
    "uploaded avatar is publicly readable",
    publicResponse.ok,
    `HTTP ${publicResponse.status}`,
  );

  await fetch(`${url}/storage/v1/object/avatars/${avatarPath}`, {
    method: "DELETE",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
}

main()
  .catch((error) => {
    failures += 1;
    console.error(error.message ?? error);
  })
  .finally(async () => {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }

    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exit(1);
    }

    console.log("\nAll auth checks passed.");
  });
