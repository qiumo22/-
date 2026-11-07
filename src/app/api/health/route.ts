import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, supabase: "reachable" });
  } catch (error) {
    console.error("Supabase health check failed:", error);

    return NextResponse.json(
      { ok: false, supabase: "unreachable" },
      { status: 500 },
    );
  }
}
