import { type Response } from 'express';
import type { Role, User } from './types/User';
import ExpressError from './ExpressError';

const ROLE_HIERARCHY: Record<Role, number> = Object.freeze({
  VIEWER: 20,
  USER: 40,
  SUPERUSER: 60,
  ADMIN: 80
});

export function hasAccess(user: User, requiredRole: Role, websiteId?: string) {
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

/** Returns true if the user is allowed access, otherwise false */
export function handleAccessControl(res: Response, user: User, requiredRole: Role,
  websiteId?: string) {
  if (hasAccess(user, requiredRole, websiteId)) return;

  if (!user) {
    throw new ExpressError('Unauthorized', 401);
  } else {
    throw new ExpressError('Forbidden', 403);
  }
}
