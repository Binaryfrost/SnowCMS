import BadRequestError from '../../../common/errors/base/BadRequestError';
import LoginConfigDTO, { SsoLoginConfigDTO } from '../../../lib/client/dto/login/LoginConfigDTO';
import LogoutDTO from '../../../lib/client/dto/login/LogoutDTO';
import Service from '../Service';
import EmailService from '../email/EmailService';
import SessionService from '../session/SessionService';
import SsoService, { SsoState } from '../sso/SsoService';
import UserService from '../user/UserService';

export default class LoginService extends Service {
  private userService: UserService;
  private sessionService: SessionService;
  private ssoService: SsoService;
  private emailService: EmailService;

  constructor(
    userService: UserService,
    sessionService: SessionService,
    ssoService: SsoService,
    emailService: EmailService
  ) {
    super();
    this.userService = userService;
    this.sessionService = sessionService;
    this.ssoService = ssoService;
    this.emailService = emailService;
  }

  async login(email: string, password: string) {
    if (this.ssoService.isForced()) {
      throw new BadRequestError('Local accounts are disabled');
    }

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const user = await this.userService.getUserIfCredentialsCorrect(email, password);
    return this.sessionService.createSession(user.id);
  }

  getLoginConfig() {
    return new LoginConfigDTO(
      this.ssoService.isEnabled() ?
        new SsoLoginConfigDTO(
          true,
          this.ssoService.isForced(),
          this.ssoService.getButtonText()
        ) : null,
      this.emailService.isEnabled()
    );
  }

  async logout(token: string) {
    let redirect = '/login';

    if (token) {
      const session = await this.sessionService.getSession(token);
      if (session) {
        await this.sessionService.deleteSession(token);

        if (session.sso && this.ssoService.isEnabled()) {
          const endSessionEndpoint = await this.ssoService.getEndSessionEndpoint();
          if (endSessionEndpoint) {
            redirect = endSessionEndpoint;
          }
        }
      }
    }

    return new LogoutDTO(redirect);
  }

  async createSsoAuthorizationUrl() {
    return this.ssoService.createAuthorizationUrl();
  }

  async handleSsoCallback(originalUrl: string, ssoState: SsoState) {
    const result = await this.ssoService.handleCallback(originalUrl, ssoState);
    return this.sessionService.createSession(result.userId, result.sso);
  }
}
