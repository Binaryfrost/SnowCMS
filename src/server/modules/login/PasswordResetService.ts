import { randomBytes } from 'crypto';
import useragent from 'useragent';
import BadRequestError from '../../../common/errors/base/BadRequestError';
import ForbiddenError from '../../../common/errors/base/ForbiddenError';
import Service from '../Service';
import RedisCacheService from '../common/RedisCacheService';
import EmailService from '../email/EmailService';
import { renderEmailTemplate } from '../../email/templates/render';
import type { PasswordResetTemplate } from '../../email/templates/password-reset';
import AppConfigProvider from '../config/AppConfigProvider';
import SsoService from '../sso/SsoService';
import UserService from '../user/UserService';

export default class PasswordResetService extends Service {
  private userService: UserService;
  private redisService: RedisCacheService;
  private emailService: EmailService;
  private config: AppConfigProvider;
  private ssoService: SsoService;

  constructor(
    userService: UserService,
    redisService: RedisCacheService,
    emailService: EmailService,
    config: AppConfigProvider,
    ssoService: SsoService
  ) {
    super();
    this.userService = userService;
    this.redisService = redisService;
    this.emailService = emailService;
    this.config = config;
    this.ssoService = ssoService;
  }

  isEnabled() {
    return this.emailService.isEnabled() && !this.ssoService.isForced();
  }

  async validateToken(token: string) {
    const key = this.getKey(token);
    if (!(await this.redisService.exists(key))) {
      throw new ForbiddenError('Password reset token expired');
    }

    // Extend the token's expiry if it is still valid
    await this.redisService.expire(key, 5 * 60);
  }

  async resetPassword(token: string, password: string) {
    const key = this.getKey(token);

    if (!password) {
      throw new BadRequestError('Password is required');
    }

    const userId = await this.redisService.getCache(key);

    if (!userId) {
      throw new ForbiddenError('Password reset token expired');
    }

    await this.userService.setPassword(userId, password);
    await this.redisService.clearCache(key);
  }

  async requestPasswordReset(email: string, ip: string, reqUserAgent: string) {
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const user = await this.userService.getActiveUserIfExists(email);

    if (user) {
      const token = randomBytes(32).toString('base64url');
      await this.redisService.setCache(this.getKey(token), user.id, 15 * 60);

      const { browser, os } = this.parseUserAgent(reqUserAgent);
      const { text, html } = await renderEmailTemplate<PasswordResetTemplate>('password-reset', {
        email,
        instance_url: this.config.getInstanceUrl(),
        ip_address: ip.replace(/^::ffff:/, ''),
        browser,
        os,
        reset_link: new URL(
          `/login/password-reset#${token}`,
          this.config.getInstanceUrl()
        ).href
      });

      await this.emailService.send({
        to: email,
        subject: 'SnowCMS Password Reset',
        html,
        text
      });
    }
  }

  private getKey(token: string) {
    return `password-reset:${token}`;
  }

  private parseUserAgent(userAgent: string): { browser: string, os: string } {
    // Workaround for CVE-2020-26311
    const agent = userAgent.length <= 255 ? useragent.parse(userAgent) : null;
    return {
      browser: agent?.family || 'Unknown',
      os: agent?.os.family || 'Unknown'
    };
  }
}
