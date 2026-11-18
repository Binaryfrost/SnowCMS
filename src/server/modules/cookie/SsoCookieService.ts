import type { Request, Response } from 'express';
import Cookie from './Cookie';
import CookieService from './CookieService';

/**
 * Encrypted cookie used to store state while performing SSO login.
 * By default, valid for 1 hour.
 */
export default class SsoCookieService extends CookieService {
  public static readonly COOKIE_NAME = 'snowcms_sso';

  createCookie(value: string): Promise<Cookie> {
    return super.createCookie(SsoCookieService.COOKIE_NAME, value, {
      encrypt: true,
      maxAge: 60 * 60 * 1000
    });
  }

  get(req: Request) {
    return super.getCookie(req, SsoCookieService.COOKIE_NAME);
  }

  clear(res: Response) {
    super.clearCookie(res, SsoCookieService.COOKIE_NAME);
  }
}
