import type { Request } from 'express';
import { SessionCookie } from '../../cookie';

interface AuthToken {
  type: 'cookie' | 'apikey'
  token: string
}

export function getAuthToken(req: Request): AuthToken {
  const authorization = req.header('authorization');
  if (authorization) {
    const authHeaderParts = authorization.split(' ');
    if (authHeaderParts.length !== 2 || authHeaderParts[0] !== 'Bearer') {
      return null;
    }

    return {
      type: 'apikey',
      token: authHeaderParts[1]
    };
  }

  const cookie = SessionCookie.get(req);
  if (!cookie) return null;
  return {
    type: 'cookie',
    token: cookie.getData()
  };
}
