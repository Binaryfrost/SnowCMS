import type { Request, Response } from 'express';
import crypto from 'crypto';
import { getConfig } from './config/config';
import { hmac, secureEquals, secureRandom, secureRandomBytes } from './util';
import { CSRF_COOKIE } from '../common/constants';

interface EncryptedCookiePayload {
  iv: string
  enc: string
  hmac: string
}

export interface CookieOpts {
  secure: boolean
  httpOnly: boolean
  maxAge: number
}

export class ReadOnlyCookie {
  protected readonly name: string;
  protected readonly data: string;

  protected constructor(name: string, data: string) {
    this.name = name;
    this.data = data;
  }

  /**
   * Returns the name of this cookie
   */
  getName() {
    return this.name;
  }

  /**
   * Returns the unencrypted value of this cookie
   * @returns 
   */
  getData() {
    return this.data;
  }
}

/**
 * A cookie that is, by default:
 * - HTTP Only
 * - Secure (in production)
 * - Expires in 24 hours
 * - Encrypted
 * 
 * The encrypted cookie is serialized as base64 encoded JSON and has the following structure:
 * - `iv`: Initialization vector
 * - `enc`: Encrypted data, encoded as base64
 * - `hmac`: HMAC of name, IV, and encrypted data
 */
export default class Cookie extends ReadOnlyCookie {
  private static readonly ENCRYPT_ALGORITHM = 'aes-256-cbc';
  private static DEFAULT_OPTS: Readonly<CookieOpts>;
  private encrypted = true;
  // The defaults for these are taken from DEFAULT_OPTS after initialization
  private secure: boolean;
  private httpOnly: boolean;
  private maxAge: number;

  /**
   * Creates a new encrypted cookie
   * @param name The cookie name
   * @param data The data, serialized as a string
   */
  constructor(name: string, data: string) {
    super(name, data);
    if (!Cookie.DEFAULT_OPTS) Cookie.initDefaultOpts();
    const { secure, httpOnly, maxAge } = Cookie.DEFAULT_OPTS;
    this.secure = secure;
    this.httpOnly = httpOnly;
    this.maxAge = maxAge;
  }

  /**
   * Marks the cookie to be used with HTTPS only.
   */
  setSecure(secure: boolean) {
    this.secure = secure;
  }

  /**
   * Returns whether this cookie will only be usable with HTTPS.
   */
  isSecure() {
    return this.secure;
  }

  /**
   * Flags the cookie to be accessible only by the web server.
   */
  setHttpOnly(httpOnly: boolean) {
    this.httpOnly = httpOnly;
  }

  /**
   * Returns whether this cookie is only accessible by the web server.
   */
  isHttpOnly() {
    return this.httpOnly;
  }

  /**
   * Sets the expiry time relative to the current time.
   * @param maxAge The number of milliseconds that this cookie should be valid for
   */
  setMaxAge(maxAge: number) {
    this.maxAge = maxAge;
  }

  /**
   * Returns the expiry time relative to the current time, in milliseconds.
   */
  getMaxAge() {
    return this.maxAge;
  }

  /**
   * Sets whether this cookie should be encrypted.
   */
  setEncrypted(encrypted: boolean) {
    this.encrypted = encrypted;
  }

  /**
   * Returns whether this cookie is encrypted.
   */
  isEncrypted() {
    return this.encrypted;
  }

  /**
   * Sets the encrypted cookie on the response
   * @param res Express response
   */
  setCookie(res: Response) {
    let cookiePayload = this.data;
    if (this.encrypted) {
      const encrypted = Cookie.encrypt(this.name, this.data);
      cookiePayload = Buffer.from(JSON.stringify(encrypted)).toString('base64');
    }

    res.cookie(this.name, cookiePayload, this.getCookieOpts());
  }

  /**
   * Removes cookie.
   * 
   * **Important:** Cookie opts must be the same as when cookie was set
   * @param res Express response
   */
  clearCookie(res: Response) {
    Cookie.clearCookie(res, 'name', this.getCookieOpts());
  }

  /** @see {@link Cookie#clearCookie} */
  static clearCookie(res: Response, name: string, opts: CookieOpts) {
    const optsCopy = { ...opts };
    delete optsCopy.maxAge;
    res.clearCookie(name, optsCopy);
  }

  /**
   * Returns whether the request contains a cookie with this name
   */
  static has(req: Request, name: string) {
    return name in req.cookies;
  }

  /**
   * Returns the cookie, if it exists, otherwise null.
   * If the decryption fails, null will be returned.
   * @param req Express request
   * @param name Cookie name
   * @param encrypted Whether this cookie is encrypted
   */
  static get(req: Request, name: string, encrypted: boolean = true) {
    try {
      const cookie = req.cookies[name];
      if (!cookie) return null;
      if (!encrypted) return new Cookie(name, cookie);
      const decrypted = this.decrypt(name, cookie);
      // We don't know what flags (secure, HTTPOnly, etc.) are set on this cookie,
      // so to avoid confusion, we return a read-only cookie. This can be converted
      // to a modifiable cookie using the `fromReadOnly` method.
      return new ReadOnlyCookie(name, decrypted);
    } catch(_) {
      return null;
    }
  }

  /**
   * Converts a read-only cookie to a modifiable and settable cookie.
   * Extending classes should override this to create an instance of
   * that class instead.
   */
  // https://stackoverflow.com/a/60210424
  static fromReadOnly(cookie: ReadOnlyCookie) {
    if (!cookie) return null;
    return new Cookie(cookie.getName(), cookie.getData());
  }

  /**
   * Returns the default cookie options.
   */
  static getDefaultOpts() {
    if (!Cookie.DEFAULT_OPTS) this.initDefaultOpts();
    return Cookie.DEFAULT_OPTS;
  }

  private static deriveKeyFromSecret(secret: string) {
    return Buffer.from(
      crypto.createHash('sha256')
        .update(secret)
        .digest('hex'),
      'hex'
    );
  }

  private static generateIv() {
    return secureRandomBytes(16);
  }

  private static encrypt(name: string, value: string): EncryptedCookiePayload {
    const { secret } = getConfig();
    
    const iv = this.generateIv();
    const key = this.deriveKeyFromSecret(secret);
    const cipher  = crypto.createCipheriv(this.ENCRYPT_ALGORITHM, key, iv);

    const encodedIv = iv.toString('base64');
    const enc = cipher.update(value, 'utf8', 'base64') + cipher.final('base64');

    return {
      iv: encodedIv,
      enc,
      hmac: Cookie.#hmac(secret, name, encodedIv, enc)
    };
  }

  private static decrypt(name: string, value: string) {
    const { secret } = getConfig();

    const { iv, enc, hmac: cookieHmac }: EncryptedCookiePayload = JSON.parse(
      Buffer.from(value, 'base64').toString()
    );

    if (!iv || !enc || !cookieHmac) {
      throw new Error('Invalid encrypted cookie: Missing IV, HMAC, or encrypted data');
    }

    const computedHmac = Cookie.#hmac(secret, name, iv, enc);
    if (!secureEquals(cookieHmac, computedHmac)) {
      throw new Error('Invalid encrypted cookie: HMAC mismatch');
    }

    const key = this.deriveKeyFromSecret(secret);
    const decipher = crypto.createDecipheriv(this.ENCRYPT_ALGORITHM, key, Buffer.from(iv, 'base64'));
    return decipher.update(enc, 'base64', 'utf8') + decipher.final('utf8');
  }

  static #hmac(secret: string, name: string, iv: string, enc: string) {
    return hmac(secret, name, iv, enc);
  }

  // getConfig() is not available at the time modules are imported,
  // so we initialize the default cookie options this way instead
  private static initDefaultOpts() {
    Cookie.DEFAULT_OPTS = Object.freeze<CookieOpts>({
      // Allow HTTP access over LAN during development
      secure: __SNOWCMS_IS_PRODUCTION__ &&
        getConfig().instanceRootUrl.startsWith('https://') ? true : false,
      httpOnly: true,
      // 24 hours
      maxAge: 24 * 60 * 60 * 1000
    });
  }

  private getCookieOpts(): CookieOpts {
    return {
      secure: this.secure,
      httpOnly: this.httpOnly,
      maxAge: this.maxAge
    };
  }
}

/**
 * An encrypted session cookie.
 * By default, valid for 24 hours.
 */
export class SessionCookie extends Cookie {
  public static readonly COOKIE_NAME = 'snowcms_session';

  /**
   * Creates a new session cookie with the given session ID
   */
  constructor(sessionId: string) {
    super(SessionCookie.COOKIE_NAME, sessionId);
  }

  override setCookie(res: Response) {
    super.setCookie(res);
    this.setCsrfCookie(res);
  }

  /**
   * Generates and sets a new CSRF cookie linked to this session  
   */
  setCsrfCookie(res: Response) {
    new CsrfCookie(this.getData()).setCookie(res);
  }

  static override fromReadOnly(cookie: ReadOnlyCookie) {
    if (!cookie) return null;
    if (cookie.getName() != SessionCookie.COOKIE_NAME) return null;
    return new SessionCookie(cookie.getData());
  }

  static override clearCookie(res: Response) {
    super.clearCookie(res, this.COOKIE_NAME, Cookie.getDefaultOpts());
    CsrfCookie.clearCookie(res);
  }

  static override get(req: Request) {
    return super.get(req, this.COOKIE_NAME);
  }
}

/**
 * Encrypted cookie used to store state while performing SSO login.
 * By default, valid for 1 hour.
 */
export class SsoStateCookie extends Cookie {
  private static readonly COOKIE_NAME = 'snowcms_sso';
  private static maxAge = 60 * 60 * 1000;

  constructor(state: string) {
    super(SsoStateCookie.COOKIE_NAME, state);
    this.setMaxAge(SsoStateCookie.maxAge);
  }

  static override fromReadOnly(cookie: ReadOnlyCookie) {
    if (!cookie) return null;
    if (cookie.getName() != SsoStateCookie.COOKIE_NAME) return null;
    return new SsoStateCookie(cookie.getData());
  }

  static override clearCookie(res: Response) {
    super.clearCookie(res, this.COOKIE_NAME, Cookie.getDefaultOpts());
  }

  static override get(req: Request) {
    return super.get(req, this.COOKIE_NAME);
  }
}

/**
 * Plaintext CSRF cookie
 */
export class CsrfCookie extends Cookie {
  /**
   * Generates a new CSRF cookie linked to the given session ID
   */
  constructor(sessionId: string);
  /**
   * Converts a ReadOnlyCookie to a CsrfCookie, keeping the same
   * random value instead of generating a new one.
   */
  constructor(cookie: ReadOnlyCookie);
  constructor(sessionId: string | ReadOnlyCookie) {
    if (typeof sessionId !== 'string') {
      const cookie = sessionId;
      super(CSRF_COOKIE, cookie.getData());
    } else {
      const random = secureRandom(32);
      const tokenHmac = CsrfCookie.#hmac(sessionId, random);
      const cookie = `${tokenHmac}.${random}`;

      super(CSRF_COOKIE, cookie);
    }

    this.setEncrypted(false);
    this.setHttpOnly(false);
  }

  /**
   * Verifies that this CSRF cookie is valid, is linked to the current session,
   * and matches the user-provided CSRF token. It is recommended to generate a
   * new CSRF cookie if validation fails to ensure that legitimate users are
   * able to continue using the app without having to log out and back in again.
   * @param sessionId The current session ID
   */
  verify(sessionId: string, providedToken: string): boolean {
    const [ tokenHmac, random ] = this.data.split('.');

    if (!tokenHmac || !random) return false;

    const computedHmac = CsrfCookie.#hmac(sessionId, random);
    if (!secureEquals(computedHmac, tokenHmac)) return false;

    return secureEquals(this.data, providedToken);
  }

  static #hmac(sessionId: string, random: string) {
    const { secret } = getConfig();
    return hmac(secret, sessionId, random);
  }

  static override fromReadOnly(cookie: ReadOnlyCookie) {
    if (!cookie) return null;
    if (cookie.getName() != CSRF_COOKIE) return null;
    return new CsrfCookie(cookie);
  }

  static override clearCookie(res: Response) {
    super.clearCookie(res, CSRF_COOKIE, {
      ...Cookie.getDefaultOpts(),
      httpOnly: false
    });
  }

  /**
   * Returns the CSRF cookie. If it does not exist, null is returned and you should
   * reject the request and set a new CSRF token using {@link SessionCookie#setCsrfCookie}
   * @param req 
   * @returns 
   */
  static override get(req: Request) {
    return this.fromReadOnly(super.get(req, CSRF_COOKIE, false));
  }
}
