import type { Role, UserWithWebsites } from '../common/types/User';
import ExpressError from '../common/errors/base/ExpressError';
import { hasAccess } from '../common/users';

export default function handleAccessControl(user: UserWithWebsites,
  requiredRole: Role, websiteId?: string) {
  if (hasAccess(user, requiredRole, websiteId)) return;

  if (!user) {
    throw new ExpressError('Unauthorized', 401);
  } else {
    throw new ExpressError('Forbidden', 403);
  }
}
