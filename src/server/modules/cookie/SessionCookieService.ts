import Cookie from './Cookie';
import CookieService from './CookieService';

// TODO: Use new cookie services

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
}
