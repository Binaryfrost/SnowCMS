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

  /**
   * TODO: Move cookie code into here
   *
   * This class (and extending classes) should only concern themselves with
   * the cookie content and options: not setting or retrieving the cookie.
   * It should encrypt, decrypt, and validate the content. Extending classes
   * provide specific overrides, options, types, or helper methods for the
   * cookie they manage.
   */

  async createCookie(name: string, value: string, options: Partial<CookieOptions>) {
    return new Cookie(
      name,
      options.encrypt ? await this.encryption.encryptAsString(value) : value,
      this.mergeDefaultOpts(options)
    );
  }

  private mergeDefaultOpts(options: Partial<CookieOptions>): HttpCookieOptions {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encrypt, ...opts } = options;
    return {
      ...opts,
      ...this.DEFAULT_OPTS
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
