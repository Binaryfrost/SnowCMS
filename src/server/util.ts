import type { Request, RequestHandler } from 'express';

export function asyncRouteFix<T extends RequestHandler>(callback: T): RequestHandler {
  return (req, res, next) => {
    new Promise((resolve) => {
      resolve(callback(req, res, next));
    }).catch(next);
  };
}

export function getAuthToken(req: Request) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.includes(':')) {
    return null;
  }

  const authHeaderParts = authorization.split(' ');
  if (authHeaderParts.length < 2 || authHeaderParts[0] !== 'Bearer') {
    return null;
  }

  const token = authHeaderParts[1];
  return token;
}
