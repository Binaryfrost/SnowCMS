import type { Request, Response } from 'express';
import InvalidCsrfTokenError from '../../../common/errors/InvalidCsrfTokenError';
import Cookie from './Cookie';
import CookieService from './CookieService';

/**
 * Plaintext CSRF cookie linked to the current session and protected
 * against tampering.
 */
export default class CsrfCookieService extends CookieService {
  public static readonly COOKIE_NAME = 'snowcms_csrf';

  async createCookie(sessionId: string): Promise<Cookie> {
    const random = this.encryption.secureRandom(32);
    const tokenHmac = await this.encryption.hmac(this.formatHmacPayload(sessionId, random));
    const value = this.formatCookie(tokenHmac, random);
    return super.createCookie(CsrfCookieService.COOKIE_NAME, value, {
      encrypt: false,
      httpOnly: false
    });
  }

  get(req: Request) {
    return super.getCookie(req, CsrfCookieService.COOKIE_NAME);
  }

  clear(res: Response) {
    super.clearCookie(res, CsrfCookieService.COOKIE_NAME);
  }

  /**
   * Verifies that this CSRF cookie is valid, is linked to the current session,
   * and matches the user-provided CSRF token. It is recommended to generate a
   * new CSRF cookie if validation fails to ensure that legitimate users are
   * able to continue using the app without having to log out and back in again.
   * @param sessionId The current session ID
   * @param cookie The cookie
   * @param token The user provided token
   */
  async verifyCsrfCookie(sessionId: string, cookie: string, token: string) {
    const [tokenHmac, random] = this.parseCookie(cookie);
    if (!tokenHmac || !random) return false;

    const validHmac = await this.encryption.verifyHmac(
      tokenHmac, this.formatHmacPayload(sessionId, random)
    );
    if (!validHmac) return false;

    return this.encryption.secureEquals(cookie, token);
  }

  private getDefaultSecure() {
    return false;
  }

  private formatHmacPayload(sessionId: string, random: string) {
    return `${sessionId}.${random}`;
  }

  private formatCookie(tokenHmac: string, random: string) {
    return `${tokenHmac}.${random}`;
  }

  private parseCookie(cookie: string): [string, string] {
    const parts = cookie.split('.');
    if (parts.length !== 2) {
      throw new InvalidCsrfTokenError();
    }

    const [tokenHmac, random] = parts;
    if (tokenHmac.length === 0 || random.length === 0) {
      throw new InvalidCsrfTokenError();
    }

    return [tokenHmac, random];
  }
}
