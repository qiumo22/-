import { describe, expect, it } from "vitest";

import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  normalizeEmail,
  normalizeUsername,
  validateAvatar,
  validateLogin,
  validateProfile,
  validateRegistration,
} from "@/lib/auth/validation";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Lin@Example.COM ")).toBe("lin@example.com");
  });
});

describe("normalizeUsername", () => {
  it("trims and lowercases", () => {
    expect(normalizeUsername("  Lin_Xia ")).toBe("lin_xia");
  });
});

describe("validateRegistration", () => {
  const valid = {
    email: "lin@example.com",
    password: "Campus123456!",
    confirmPassword: "Campus123456!",
  };

  it("accepts a valid registration", () => {
    expect(validateRegistration(valid)).toBeNull();
  });

  it("rejects an invalid email", () => {
    expect(validateRegistration({ ...valid, email: "not-an-email" })).toContain(
      "邮箱",
    );
  });

  it("rejects a short password", () => {
    expect(validateRegistration({ ...valid, password: "short" })).toContain(
      "至少",
    );
  });

  it("rejects mismatched passwords", () => {
    expect(
      validateRegistration({ ...valid, confirmPassword: "different" }),
    ).toContain("不一致");
  });
});

describe("validateLogin", () => {
  it("requires both fields", () => {
    expect(validateLogin({ email: "", password: "" })).not.toBeNull();
  });

  it("accepts filled fields", () => {
    expect(
      validateLogin({ email: "lin@example.com", password: "x" }),
    ).toBeNull();
  });
});

describe("validateProfile", () => {
  const valid = {
    username: "lin_xia",
    displayName: "林夏",
    bio: "中文系学生。",
  };

  it("accepts a valid profile", () => {
    expect(validateProfile(valid)).toBeNull();
  });

  it("rejects an invalid username", () => {
    expect(validateProfile({ ...valid, username: "林夏" })).toContain("用户名");
  });

  it("rejects a blank display name", () => {
    expect(validateProfile({ ...valid, displayName: "  " })).toContain(
      "显示名",
    );
  });

  it("rejects an overlong bio", () => {
    expect(validateProfile({ ...valid, bio: "长".repeat(201) })).toContain(
      "简介",
    );
  });
});

describe("validateAvatar", () => {
  it("accepts allowed image types", () => {
    expect(
      validateAvatar({ type: ALLOWED_AVATAR_TYPES[0], size: 1024 }),
    ).toBeNull();
  });

  it("rejects unsupported types", () => {
    expect(validateAvatar({ type: "image/gif", size: 1024 })).toContain("PNG");
  });

  it("rejects files above the limit", () => {
    expect(
      validateAvatar({
        type: ALLOWED_AVATAR_TYPES[0],
        size: MAX_AVATAR_BYTES + 1,
      }),
    ).toContain("2MB");
  });
});
