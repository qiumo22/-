export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateRegistration(input: {
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  if (!EMAIL_PATTERN.test(input.email)) {
    return "请输入有效的邮箱地址";
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return `密码至少需要 ${MIN_PASSWORD_LENGTH} 位`;
  }

  if (input.password !== input.confirmPassword) {
    return "两次输入的密码不一致";
  }

  return null;
}

export function validateLogin(input: {
  email: string;
  password: string;
}): string | null {
  if (!input.email || !input.password) {
    return "请输入邮箱和密码";
  }

  return null;
}

export function validateProfile(input: {
  username: string;
  displayName: string;
  bio: string;
}): string | null {
  if (!USERNAME_PATTERN.test(input.username)) {
    return "用户名需为 3–30 位字母、数字、下划线或连字符";
  }

  if (!input.displayName.trim()) {
    return "请填写显示名";
  }

  if (input.displayName.trim().length > 30) {
    return "显示名不能超过 30 个字符";
  }

  if (input.bio.length > 200) {
    return "简介不能超过 200 个字符";
  }

  return null;
}

export function validateAvatar(file: {
  type: string;
  size: number;
}): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return "头像仅支持 PNG、JPEG 或 WebP";
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return "头像不能超过 2MB";
  }

  return null;
}
