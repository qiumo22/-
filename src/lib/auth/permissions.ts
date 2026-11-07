export type PermissionProfile = {
  role: string;
  status: string;
} | null;

export function isActiveProfile(
  profile: PermissionProfile,
): profile is { role: string; status: string } {
  return profile?.status === "active";
}

export function canAccessAdmin(profile: PermissionProfile) {
  return profile?.role === "admin" && profile.status === "active";
}
