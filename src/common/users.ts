import type { Role, UserWithWebsites } from './types/User';

export const ROLE_HIERARCHY = Object.freeze({
  VIEWER: 20,
  USER: 40,
  SUPERUSER: 60,
  ADMIN: 80
});

export function hasAccess(user: UserWithWebsites, requiredRole: Role, websiteId?: string) {
  if (!user) return false;

  const userRoleWeight = ROLE_HIERARCHY[user.role];
  const requiredRoleWeight = ROLE_HIERARCHY[requiredRole];

  if (userRoleWeight >= requiredRoleWeight) {
    if (websiteId) {
      if (user.role === 'ADMIN') return true;

      return user.websites.includes(websiteId);
    }

    return true;
  }

  return false;
}
