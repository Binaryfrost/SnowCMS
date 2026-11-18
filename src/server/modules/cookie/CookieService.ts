import type { Request, Response } from 'express';
import Service from '../Service';
import EncryptionService, { EncryptedData } from '../common/EncryptionService';
import AppConfigProvider from '../config/AppConfigProvider';
import Cookie, { HttpCookieOptions } from './Cookie';

export interface CookieOptions extends HttpCookieOptions {
  encrypt: boolean
}

export default class CookieService extends Service {
  private DEFAULT_OPTS: Readonly<HttpCookieOptions>;
  protected encryption: EncryptionService;

  constructor(encryption: EncryptionService, config: AppConfigProvider) {
    super();
    this.encryption = encryption;
    this.DEFAULT_OPTS = Object.freeze<HttpCookieOptions>({
      // Allow HTTP access over LAN during development
      secure: !!(config.isProduction() && config.getInstanceUrl().startsWith('https://')),
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
  }

  async createCookie(name: string, value: string, options: Partial<CookieOptions>) {
    return new Cookie(
      name,
      options.encrypt ? await this.encryption.encryptAsString(value) : value,
      this.mergeDefaultOpts(options)
    );
  }

  setCookie(res: Response, cookie: Cookie) {
    res.cookie(cookie.getName(), cookie.getData(), cookie.getOpts());
  }

  clearCookie(res: Response, name: string, opts?: HttpCookieOptions) {
    const cookieOpts = { ...(opts || this.DEFAULT_OPTS) };
    delete cookieOpts.maxAge;
    res.clearCookie(name, cookieOpts);
  }

  async getCookie(req: Request, name: string) {
    const raw = req.cookies[name];
    if (!raw) return null;

    if (!this.isEncrypted(raw)) return raw;

    try {
      return await this.getDecryptedValue(raw);
    } catch {
      return null;
    }
  }

  private mergeDefaultOpts(options: Partial<CookieOptions>): HttpCookieOptions {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encrypt, ...opts } = options;
    return {
      ...this.DEFAULT_OPTS,
      ...opts
    };
  }

  isEncrypted(data: string) {
    try {
      const decoded: EncryptedData = JSON.parse(
        Buffer.from(data, 'base64').toString()
      );
      const keys: (keyof EncryptedData)[] = ['enc', 'hmac', 'iv'];
      if (!keys.every((key) => key in decoded && typeof decoded[key] === 'string')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async getDecryptedValue(data: string) {
    if (!this.isEncrypted(data)) return data;
    return this.encryption.decrypt(JSON.parse(data));
  }
}
