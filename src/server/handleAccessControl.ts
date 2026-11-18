import type UserDTO from '../lib/client/dto/user/UserDTO';
import { hasAccess, type Role } from '../common/users';
import ExpressError from '../common/errors/base/ExpressError';

export default function handleAccessControl(user: UserDTO,
  requiredRole: Role, websiteId?: string) {
  if (hasAccess(user, requiredRole, websiteId)) return;

  if (!user) {
    throw new ExpressError('Unauthorized', 401);
  } else {
    throw new ExpressError('Forbidden', 403);
  }
}
