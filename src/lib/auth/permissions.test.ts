import { describe, expect, it } from "vitest";

import { canAccessAdmin, isActiveProfile } from "@/lib/auth/permissions";

describe("isActiveProfile", () => {
  it("returns false for a missing profile", () => {
    expect(isActiveProfile(null)).toBe(false);
  });

  it("returns true for an active profile", () => {
    expect(isActiveProfile({ role: "author", status: "active" })).toBe(true);
  });

  it("returns false for a banned profile", () => {
    expect(isActiveProfile({ role: "author", status: "banned" })).toBe(false);
  });
});

describe("canAccessAdmin", () => {
  it("allows an active admin", () => {
    expect(canAccessAdmin({ role: "admin", status: "active" })).toBe(true);
  });

  it("rejects an active author", () => {
    expect(canAccessAdmin({ role: "author", status: "active" })).toBe(false);
  });

  it("rejects a banned admin", () => {
    expect(canAccessAdmin({ role: "admin", status: "banned" })).toBe(false);
  });

  it("rejects a missing profile", () => {
    expect(canAccessAdmin(null)).toBe(false);
  });
});
