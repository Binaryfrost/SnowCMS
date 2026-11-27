import { randomBytes } from 'crypto';
import * as oidcClient from 'openid-client';
import BadRequestError from '../../../common/errors/base/BadRequestError';
import UnauthorizedError from '../../../common/errors/base/UnauthorizedError';
import CreateUserDTO from '../../../lib/client/dto/user/CreateUserDTO';
import SsoConfigProvider from '../config/SsoConfigProvider';
import Service from '../Service';
import UserService from '../user/UserService';

export interface SsoState {
  cv: string
  s: string
}

export interface SsoCallbackResult {
  userId: string
  sso: boolean
}

export default class SsoService extends Service {
  private config: SsoConfigProvider | null;
  private userService: UserService;
  private discoveryPromise: Promise<oidcClient.Configuration> | null = null;

  constructor(config: SsoConfigProvider | null, userService: UserService) {
    super();
    this.config = config;
    this.userService = userService;
  }

  isEnabled() {
    return !!this.config;
  }

  isForced() {
    return this.config?.isSsoForced() || false;
  }

  getButtonText() {
    return this.config?.getButtonText() || 'Log in with SSO';
  }

  private ensureEnabled() {
    if (!this.config) throw new BadRequestError('SSO is not enabled');
    return this.config;
  }

  private getClient() {
    const config = this.ensureEnabled();
    if (!this.discoveryPromise) {
      this.discoveryPromise = oidcClient.discovery(
        new URL(config.getIssuer()),
        config.getClientId(),
        config.getClientSecret()
      );
    }
    return this.discoveryPromise;
  }

  async createAuthorizationUrl() {
    const config = this.ensureEnabled();
    const client = await this.getClient();

    const redirectUri = config.getCallbackUrl();
    const scope = 'openid profile email';

    const codeVerifier = oidcClient.randomPKCECodeVerifier();
    const codeChallenge = await oidcClient.calculatePKCECodeChallenge(codeVerifier);
    let state;

    const parameters: Record<string, string> = {
      redirect_uri: redirectUri,
      scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    };

    if (!client.serverMetadata().supportsPKCE()) {
      state = oidcClient.randomState();
      parameters.state = state;
    }

    const redirectTo = oidcClient.buildAuthorizationUrl(client, parameters);

    const ssoState: SsoState = {
      cv: codeVerifier,
      s: state
    };

    return {
      redirectUrl: redirectTo.href,
      ssoState
    };
  }

  async handleCallback(originalUrl: string, state: SsoState) {
    const config = this.ensureEnabled();
    const client = await this.getClient();

    const url = new URL(originalUrl, config.getCallbackUrl());
    // Some SSO servers include the state parameter even if the original request didn't have it
    if (!url.searchParams.get('state')) {
      url.searchParams.delete('state');
    }

    const tokens = await oidcClient.authorizationCodeGrant(
      client,
      url,
      {
        pkceCodeVerifier: state.cv,
        expectedState: state.s
      }
    );

    const userInfo = await oidcClient.fetchUserInfo(
      client,
      tokens.access_token,
      tokens.claims().sub
    );

    const { email, email_verified: emailVerified } = userInfo;

    if (!email) {
      throw new BadRequestError('The SSO provider did not return the user\'s email address');
    }

    if ('email_verified' in userInfo && !emailVerified) {
      throw new BadRequestError('The SSO provider reports that the email has not yet been verified');
    }

    const user = await this.userService.getUserByEmail(email);

    if (user) {
      if (!user.active) {
        throw new BadRequestError('User is not active');
      }

      return {
        userId: user.id,
        sso: true
      };
    }

    if (config.getDefaultRole() === null) {
      throw new UnauthorizedError('That user does not exist');
    }

    // TODO: Set null password for SSO-created accounts. Require user to set
    // password through the dashboard to utilize password login.
    const userId = await this.userService.create(new CreateUserDTO(
      email,
      config.getDefaultRole(),
      randomBytes(32).toString('base64url'),
      true,
      []
    ));

    return {
      userId,
      sso: true
    };
  }

  async getEndSessionEndpoint() {
    const client = await this.getClient();
    return client.serverMetadata().end_session_endpoint || null;
  }
}
