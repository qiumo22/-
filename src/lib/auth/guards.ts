import { redirect } from "next/navigation";

import { canAccessAdmin, isActiveProfile } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  role: "reader" | "author" | "admin";
  status: "active" | "banned";
  created_at: string;
  updated_at: string;
};

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function getCurrentProfile() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile: (data as Profile | null) ?? null };
}

export async function requireActiveUser() {
  const { supabase, user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!isActiveProfile(profile)) {
    await supabase.auth.signOut();
    redirect("/login?error=banned");
  }

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const result = await requireActiveUser();

  if (!canAccessAdmin(result.profile)) {
    redirect("/unauthorized");
  }

  return result;
}
