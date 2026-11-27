import type { NextFunction, Request, Response } from 'express';
import Middleware from './Middleware';
import { Role } from './user/UserRepository';
import UserService from './user/UserService';
import UnauthorizedError from '../../common/errors/base/UnauthorizedError';
import SessionService from './session/SessionService';
import { ROLE_HIERARCHY } from '../../common/users';
import ForbiddenError from '../../common/errors/base/ForbiddenError';
import { CSRF_HEADER } from '../../common/constants';
import NoCsrfTokenError from '../../common/errors/NoCsrfTokenError';
import NoCsrfCookieError from '../../common/errors/NoCsrfCookieError';
import InvalidCsrfTokenError from '../../common/errors/InvalidCsrfTokenError';
import UserDTO from '../../lib/client/dto/user/UserDTO';
import CsrfCookieService from './cookie/CsrfCookieService';
import SessionCookieService from './cookie/SessionCookieService';
import ApiKeyService from './user/api-key/ApiKeyService';

type WebsiteIdResolver = string | ((req: Request) => string);

export default class SecurityMiddleware extends Middleware {
  private userService: UserService;
  private sessionService: SessionService;
  private apiKeyService: ApiKeyService;
  private sessionCookieService: SessionCookieService;
  private csrfCookieService: CsrfCookieService;

  constructor(
    userService: UserService,
    sessionService: SessionService,
    apiKeyService: ApiKeyService,
    sessionCookieService: SessionCookieService,
    csrfCookieService: CsrfCookieService
  ) {
    super();
    this.userService = userService;
    this.sessionService = sessionService;
    this.apiKeyService = apiKeyService;
    this.sessionCookieService = sessionCookieService;
    this.csrfCookieService = csrfCookieService;
  }

  async authenticate(req: Request, res: Response, next: NextFunction) {
    const token = await this.sessionCookieService.getAuthToken(req);
    if (!token) {
      next();
      return;
    }

    if (token.type === 'cookie') {
      const user = await this.sessionService.getSessionUser(token.token);
      if (!user) {
        // If a session cookie exists, but is invalid, remove it.
        this.sessionCookieService.clear(res);
        next();
        return;
      }

      req.user = user;
      req.sessionToken = token.token;
    } else {
      const user = await this.authenticateApiKey(token.token);
      if (user) {
        req.user = user;
      }
    }

    next();
  }

  authorize(role: Role, websiteId?: WebsiteIdResolver) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) throw new UnauthorizedError();

      const websiteIdResolved = typeof websiteId === 'function' ? websiteId(req) : websiteId;

      if (ROLE_HIERARCHY[req.user.role] < ROLE_HIERARCHY[role]) {
        throw new ForbiddenError();
      }

      if (websiteIdResolved && req.user.role !== 'ADMIN' &&
        !req.user.websites.includes(websiteIdResolved)) {
        throw new ForbiddenError();
      }

      return next();
    };
  }

  async csrf(req: Request, res: Response, next: NextFunction) {
    if (!req.sessionToken) return next();

    const csrfToken = req.header(CSRF_HEADER);
    if (!csrfToken) {
      throw new NoCsrfTokenError();
    }

    const csrfCookie = await this.csrfCookieService.get(req);
    if (!csrfCookie) {
      await this.setNewCsrfCookie(res, req.sessionToken);
      throw new NoCsrfCookieError();
    }

    const valid = await this.csrfCookieService.verifyCsrfCookie(
      req.sessionToken, csrfCookie, csrfToken
    );
    if (!valid) {
      await this.setNewCsrfCookie(res, req.sessionToken);
      throw new InvalidCsrfTokenError();
    }

    return next();
  }

  private async setNewCsrfCookie(res: Response, sessionToken: string) {
    const cookie = await this.csrfCookieService.createCookie(sessionToken);
    this.csrfCookieService.setCookie(res, cookie);
  }

  private async authenticateApiKey(fullKey: string) {
    try {
      const id = this.apiKeyService.parseIdFromKey(fullKey);
      const secret = this.apiKeyService.parseSecretFromKey(fullKey);

      const apiKey = await this.apiKeyService.getApiKey(id);
      if (!apiKey || !apiKey.active) return null;

      if (!(await this.apiKeyService.validateSecret(id, secret))) return null;

      const user = await this.userService.getUser(apiKey.userId);
      if (!user || !user.active) return null;

      let { role } = apiKey;
      if (ROLE_HIERARCHY[role] > ROLE_HIERARCHY[user.role]) {
        role = user.role;
      }

      let { websites } = apiKey;
      if (user.role !== 'ADMIN') {
        websites = apiKey.websites.filter((w) => user.websites.includes(w));
      }

      return new UserDTO(
        apiKey.id,
        'apikey@snowcms',
        role,
        apiKey.active && user.active,
        websites
      );
    } catch {
      return null;
    }
  }
}
