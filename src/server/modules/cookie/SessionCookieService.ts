import type { Request, Response } from 'express';
import Cookie from './Cookie';
import CookieService from './CookieService';

interface AuthToken {
  type: 'cookie' | 'apikey'
  token: string
}

/**
 * An encrypted session cookie.
 * By default, valid for 24 hours.
 */
export default class SessionCookieService extends CookieService {
  public static readonly COOKIE_NAME = 'snowcms_session';

  createCookie(value: string): Promise<Cookie> {
    return super.createCookie(SessionCookieService.COOKIE_NAME, value, {
      encrypt: true
    });
  }

  get(req: Request) {
    return super.getCookie(req, SessionCookieService.COOKIE_NAME);
  }

  clear(res: Response) {
    super.clearCookie(res, SessionCookieService.COOKIE_NAME);
  }

  async getAuthToken(req: Request): Promise<AuthToken | null> {
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

    const cookie = await this.get(req);
    if (!cookie) return null;
    return {
      type: 'cookie',
      token: cookie
    };
  }
}
