import type { Request, Response } from 'express';
import BadRequestError from '../../../common/errors/base/BadRequestError';
import { SuccessDTOBuilder } from '../../../lib/client/dto/SuccessDTO';
import Controller from '../Controller';
import CsrfCookieService from '../cookie/CsrfCookieService';
import SessionCookieService from '../cookie/SessionCookieService';
import SsoCookieService from '../cookie/SsoCookieService';
import LoginService from './LoginService';
import PasswordResetService from './PasswordResetService';

export default class LoginController extends Controller {
  private loginService: LoginService;
  private passwordResetService: PasswordResetService;
  private sessionCookieService: SessionCookieService;
  private ssoCookieService: SsoCookieService;
  private csrfCookieService: CsrfCookieService;

  constructor(
    loginService: LoginService,
    passwordResetService: PasswordResetService,
    sessionCookieService: SessionCookieService,
    ssoCookieService: SsoCookieService,
    csrfCookieService: CsrfCookieService
  ) {
    super();
    this.loginService = loginService;
    this.passwordResetService = passwordResetService;
    this.sessionCookieService = sessionCookieService;
    this.ssoCookieService = ssoCookieService;
    this.csrfCookieService = csrfCookieService;
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const token = await this.loginService.login(email, password);
    await this.setSessionCookies(res, token);
    res.status(200).end();
  }

  async getConfig(req: Request, res: Response) {
    const dto = this.loginService.getLoginConfig();
    res.json(dto.toJSON());
  }

  async logout(req: Request, res: Response) {
    const authToken = await this.sessionCookieService.getAuthToken(req);
    const dto = await this.loginService.logout(authToken?.token || null);

    this.sessionCookieService.clear(res);
    this.csrfCookieService.clear(res);

    res.json(dto.toJSON());
  }

  async sso(req: Request, res: Response) {
    const { redirectUrl, ssoState } = await this.loginService.createSsoAuthorizationUrl();
    const cookie = await this.ssoCookieService.createCookie(JSON.stringify(ssoState));
    this.ssoCookieService.setCookie(res, cookie);

    res.redirect(redirectUrl);
  }

  async ssoCallback(req: Request, res: Response) {
    const cookie = await this.ssoCookieService.get(req);
    if (!cookie) {
      throw new BadRequestError('Invalid SSO cookie');
    }
    this.ssoCookieService.clear(res);

    const ssoState = JSON.parse(cookie);
    const token = await this.loginService.handleSsoCallback(req.originalUrl, ssoState);
    await this.setSessionCookies(res, token);

    res.redirect('/');
  }

  async validatePasswordResetToken(req: Request, res: Response) {
    if (!this.passwordResetService.isEnabled()) {
      throw new BadRequestError('Password resets are disabled');
    }

    const { token } = req.params;
    await this.passwordResetService.validateToken(token);
    res.status(204).end();
  }

  async resetPassword(req: Request, res: Response) {
    if (!this.passwordResetService.isEnabled()) {
      throw new BadRequestError('Password resets are disabled');
    }

    const { token } = req.params;
    const { password } = req.body;
    await this.passwordResetService.resetPassword(token, password);

    res.json(new SuccessDTOBuilder()
      .withMessage('Password reset')
      .build()
      .toJSON());
  }

  async requestPasswordReset(req: Request, res: Response) {
    if (!this.passwordResetService.isEnabled()) {
      throw new BadRequestError('Password resets are disabled');
    }

    const { email } = req.body;
    await this.passwordResetService.requestPasswordReset(
      email,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.json(new SuccessDTOBuilder()
      .withMessage('A password link has been sent to the email, if the account exists')
      .build()
      .toJSON());
  }

  private async setSessionCookies(res: Response, token: string) {
    const cookie = await this.sessionCookieService.createCookie(token);
    this.sessionCookieService.setCookie(res, cookie);

    const csrfCookie = await this.csrfCookieService.createCookie(token);
    this.csrfCookieService.setCookie(res, csrfCookie);
  }
}
