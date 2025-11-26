import { randomBytes } from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import * as oidcClient from 'openid-client';
import { v7 as uuid } from 'uuid';
import useragent from 'useragent';
import { db } from '../database/db';
import { asyncRouteFix, decrypt, encrypt, getAuthToken } from '../util';
import ExpressError from '../../common/ExpressError';
import { DatabaseUser, LoginConfig, User } from '../../common/types/User';
import { redis } from '../database/redis';
import { NormalizedConfig } from '../../config';
import { getConfig } from '../config/config';
import { Session, getSession, getUser } from '../database/util';
import * as smtp from '../email/smtp';
import { renderEmailTemplate } from '../email/templates/render';
import type { PasswordResetTemplate } from '../email/templates/password-reset';

export default async function loginRouter(sso?: NormalizedConfig['sso']) {
  const router = express.Router();
  router.use(cookieParser());

  async function createSession(userId: string, usingSso: boolean = false) {
    const token = `${userId}:${randomBytes(32).toString('base64url')}`;

    const session: Session = {
      user: userId,
      sso: usingSso
    };

    await redis().set(`session:${token}`, JSON.stringify(session), {
      EX: 86400
    });

    return token;
  }

  async function deleteSession(token: string) {
    await redis().del(`session:${token}`);
  }

  async function createSsoToken(sessionToken: string) {
    const ssoToken = randomBytes(32).toString('base64url');
    await redis().set(`sso:${ssoToken}`, sessionToken, { EX: 120 });
    return ssoToken;
  }

  async function getSsoSessionToken(ssoToken: string) {
    return await redis().getDel(`sso:${ssoToken}`);
  }

  async function getActiveUserIfExists(email: string) {
    return await db()<DatabaseUser>('users')
      .select('id', 'email', 'password', 'role', 'active')
      .where({
        email,
        active: true
      })
      .first();
  }

  router.post('/', asyncRouteFix(async (req, res) => {
    if (sso?.forceSso) {
      throw new ExpressError('Local accounts are disabled');
    }

    const { email, password } = req.body;

    if (!email || !password) {
      throw new ExpressError('Email and password are required');
    }

    const user = await getActiveUserIfExists(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ExpressError('Email or password incorrect');
    }

    const token = await createSession(user.id);

    res.json({
      token
    });
  }));

  router.get('/config', asyncRouteFix(async (req, res) => {
    const loginConfig: LoginConfig = {
      sso: {
        enabled: !!sso,
        forced: sso?.forceSso || false,
        text: sso?.buttonText || 'Log in with SSO'
      },
      smtp: smtp.isEnabled()
    };

    res.json(loginConfig);
  }));

  const ssoConfig = sso ? await oidcClient.discovery(
    new URL(sso.issuer),
    sso.clientId,
    sso.clientSecret
  ) : null;

  router.get('/logout', asyncRouteFix(async (req, res) => {
    let redirect = '/login';

    const token = getAuthToken(req);
    const session = token ? await getSession(token) : null;
    if (token && session) {
      await deleteSession(token);

      if (session.sso && ssoConfig && ssoConfig.serverMetadata().end_session_endpoint) {
        redirect = ssoConfig.serverMetadata().end_session_endpoint;
      }
    }

    res.json({
      redirect
    });
  }));

  router.use('/sso', asyncRouteFix(async (req, res, next) => {
    if (!sso) {
      throw new ExpressError('SSO is not enabled');
    }

    next();
  }));

  interface SsoCookie {
    cv: string
    s: string
  }

  router.get('/sso', asyncRouteFix(async (req, res) => {
    const redirectUri = sso.callbackUrl;
    const scope = 'openid profile email';

    const codeVerifier = oidcClient.randomPKCECodeVerifier();
    const codeChallenge = await oidcClient.calculatePKCECodeChallenge(codeVerifier);
    let state;

    const parameters: Record<string, string> = {
      redirect_uri: redirectUri,
      scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    };

    if (!ssoConfig.serverMetadata().supportsPKCE()) {
      /**
       * We cannot be sure the server supports PKCE so we're going to use state too.
       * Use of PKCE is backwards compatible even if the AS doesn't support it which
       * is why we're using it regardless. Like PKCE, random state must be generated
       * for every redirect to the authorization_endpoint.
       */
      state = oidcClient.randomState();
      parameters.state = state;
    }

    const ssoCookie: SsoCookie = {
      cv: codeVerifier,
      s: state
    };

    const { secret } = getConfig();

    const { iv, encrypted } = encrypt(secret, JSON.stringify(ssoCookie));
    res.cookie('sso', `${iv}.${encrypted}`);

    const redirectTo = oidcClient.buildAuthorizationUrl(ssoConfig, parameters);

    res.redirect(redirectTo.href);
  }));

  router.get('/sso/callback', asyncRouteFix(async (req, res) => {
    const ssoCookie = req.cookies.sso;
    if (!ssoCookie || !ssoCookie.includes('.')) {
      throw new ExpressError('Invalid SSO cookie');
    }

    const { secret } = getConfig();
    const [iv, encrypted] = ssoCookie.split('.');
    const decrypted: SsoCookie = JSON.parse(decrypt(encrypted, secret, iv));
    res.clearCookie('sso');

    const url = new URL(req.originalUrl, sso.callbackUrl);
    // Some SSO servers include the state parameter even if the original request didn't have it
    if (!url.searchParams.get('state')) {
      url.searchParams.delete('state');
    }

    const tokens = await oidcClient.authorizationCodeGrant(
      ssoConfig,
      url,
      {
        pkceCodeVerifier: decrypted.cv,
        expectedState: decrypted.s
      }
    );

    const userInfo = await oidcClient.fetchUserInfo(
      ssoConfig,
      tokens.access_token,
      tokens.claims().sub
    );

    const { email, email_verified } = userInfo;

    if (!email) {
      throw new ExpressError('The SSO provider did not return the user\'s email address');
    }

    if ('email_verified' in userInfo && !email_verified) {
      throw new ExpressError('The SSO provider reports that the email has not yet been verified');
    }

    const userWithEmail = await db()<User>('users')
      .select('id')
      .where({
        email
      })
      .first();

    let token;

    if (userWithEmail) {
      const user = await getUser(userWithEmail.id);
      if (!user.active) {
        throw new ExpressError('User is not active');
      }

      token = await createSession(user.id, true);
    } else {
      if (sso.defaultRole === null) throw new ExpressError('That user does not exist', 401);

      const id = uuid();
      await db()<DatabaseUser>('users')
        .insert({
          id,
          email,
          active: true,
          password: await bcrypt.hash(randomBytes(32).toString('base64url'), 10),
          role: sso.defaultRole || 'USER'
        });

      token = await createSession(id, true);
    }

    const ssoToken = await createSsoToken(token);

    res.redirect(`/login#${ssoToken}`);
  }));

  router.post('/sso/token', asyncRouteFix(async (req, res) => {
    const { ssoToken } = req.body;

    const token = await getSsoSessionToken(ssoToken);
    if (!token) {
      throw new ExpressError('SSO token invalid or expired, please try logging in again', 401);
    }

    res.json({
      token
    });
  }));

  router.use('/password-reset', (req, res, next) => {
    if (!smtp.isEnabled() || getConfig().sso?.forceSso) throw new ExpressError('Password resets are disabled');
    next();
  });

  router.get('/password-reset/:token', asyncRouteFix(async (req, res) => {
    const { token } = req.params;
    const key = `password-reset:${token}`;

    const exists = await redis().EXISTS(key)

    if (!exists) {
      throw new ExpressError('Password reset token expired', 403);
    }

    await redis().EXPIRE(key, 5 * 60, 'GT');

    res.status(204).end();
  }));

  router.post('/password-reset/:token', asyncRouteFix(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const key = `password-reset:${token}`;

    if (!password) {
      throw new ExpressError('Password is required');
    }

    const userId = await redis().GET(key);

    if (!userId) {
      throw new ExpressError('Password reset token expired', 403);
    }

    await db<DatabaseUser>()('users')
      .update({
        password: await bcrypt.hash(password, 10)
      })
      .where({
        id: userId,
        active: true
      });

    await redis().DEL(key);

    res.json({
      message: 'Password reset'
    });
  }));

  function parseUserAgent(userAgent: string): { browser: string, os: string } {
    const agent = useragent.parse(userAgent);
    return {
      browser: agent.toAgent() || 'Unknown',
      os: agent.os.toString() || 'Unknown'
    };
  }

  router.post('/password-reset', asyncRouteFix(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new ExpressError('Email is required');
    }

    const user = await getActiveUserIfExists(email);

    if (user) {
      const token = randomBytes(32).toString('base64url');
      await redis().SET(`password-reset:${token}`, user.id, {
        EX: 15 * 60
      });

      const { instanceRootUrl } = getConfig();
      const { browser, os } = parseUserAgent(req.headers['user-agent']);

      const { text, html } = await renderEmailTemplate<PasswordResetTemplate>('password-reset', {
        email,
        instance_url: instanceRootUrl,
        ip_address: req.ip.replace(/^::ffff:/, ''),
        browser,
        os,
        reset_link: new URL(`/login/password-reset#${token}`, instanceRootUrl).href
      });

      await smtp.send({
        to: email,
        subject: 'SnowCMS Password Reset',
        html,
        text
      });
    }

    res.json({
      message: 'A password link has been sent to the email, if the account exists'
    });
  }));

  return router;
}
