export const USER_ROLES = {
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  LEARNER: "LEARNER",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export function isElevatedRole(role?: string | null) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.INSTRUCTOR;
}

export function canManageCourse(role?: string | null) {
  return isElevatedRole(role);
}

export function canReviewContent(role?: string | null) {
  return role === USER_ROLES.ADMIN;
}
