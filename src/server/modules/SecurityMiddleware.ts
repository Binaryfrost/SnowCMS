import type { NextFunction, Request, Response } from 'express';
import Middleware from './Middleware';
import { Role } from './user/UserRepository';
import UserService from './user/UserService';
import UnauthorizedError from '../../common/errors/base/UnauthorizedError';
import { getAuthToken } from './session/SessionUtils';
import { CsrfCookie, SessionCookie } from '../cookie';
import SessionService from './session/SessionService';
import { hasAccess } from '../../common/users';
import ForbiddenError from '../../common/errors/base/ForbiddenError';
import { CSRF_HEADER } from '../../common/constants';
import NoCsrfTokenError from '../../common/errors/NoCsrfTokenError';
import NoCsrfCookieError from '../../common/errors/NoCsrfCookieError';
import InvalidCsrfTokenError from '../../common/errors/InvalidCsrfTokenError';

// TODO: Implement methods
export default class SecurityMiddleware extends Middleware {
  private userService: UserService;
  private sessionService: SessionService;

  constructor(userService: UserService, sessionService: SessionService) {
    super();
    this.userService = userService;
    this.sessionService = sessionService;
  }

  async authenticate(req: Request, res: Response, next: NextFunction) {
    const token = getAuthToken(req);
    if (token) {
      if (req.cookies[SessionCookie.COOKIE_NAME]) {
        SessionCookie.clearCookie(res);
      }

      throw new UnauthorizedError();
    }

    if (token.type === 'cookie') {
      const user = await this.sessionService.getSession(token.token);
      if (!user) throw new UnauthorizedError();
      req.user = user;
      req.sessionCookie = SessionCookie.fromReadOnly(SessionCookie.get(req));
    } else {
      // TODO: Check API key against database, checking that the API key role is not higher than user role
    }

    next();
  }

  authorize(role: Role, websiteId?: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) throw new UnauthorizedError();

      if (req.user.role === 'ADMIN') return next();
      if (!hasAccess(req.user, role, websiteId)) {
        throw new ForbiddenError();
      }

      return next();
    };
  }

  csrf(req: Request, res: Response, next: NextFunction) {
    if (!req.user) throw new UnauthorizedError();

    const { sessionCookie } = req;
    // Authenticated with API key
    if (!sessionCookie) return next();
    const sessionId = sessionCookie.getData();

    const csrfToken = req.header(CSRF_HEADER);
    if (!csrfToken) {
      throw new NoCsrfTokenError();
    }

    const csrfCookie = CsrfCookie.get(req);
    if (!csrfCookie) {
      sessionCookie.setCsrfCookie(res);
      throw new NoCsrfCookieError();
    }

    if (!csrfCookie.verify(sessionId, csrfToken)) {
      sessionCookie.setCsrfCookie(res);
      throw new InvalidCsrfTokenError();
    }

    return next();
  }
}
