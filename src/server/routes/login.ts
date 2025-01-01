import { randomBytes } from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import * as oidcClient from 'openid-client';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { asyncRouteFix, decrypt, encrypt } from '../util';
import ExpressError from '../../common/ExpressError';
import { DatabaseUser, LoginConfig, User } from '../../common/types/User';
import { redis } from '../database/redis';
import { NormalizedConfig } from '../../config';
import { getConfig } from '../config/config';
import { getUser } from '../database/util';

export default async function loginRouter(sso?: NormalizedConfig['sso']) {
  const router = express.Router();
  router.use(cookieParser());

  async function createSession(userId: string) {
    const token = `${userId}:${randomBytes(32).toString('base64url')}`;

    await redis().set(`session:${token}`, userId, {
      EX: 86400
    });

    return token;
  }

  router.post('/', asyncRouteFix(async (req, res) => {
    if (sso?.forceSso) {
      throw new ExpressError('Local accounts are disabled');
    }

    const { email, password } = req.body;

    if (!email || !password) {
      throw new ExpressError('Email and password are required');
    }

    const user = await db()<DatabaseUser>('users')
      .select('id', 'email', 'password', 'role', 'active')
      .where({
        email
      })
      .first();

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
        forced: sso?.forceSso || false
      }
    };

    res.json(loginConfig);
  }));

  const ssoConfig = sso ? await oidcClient.discovery(
    new URL(sso.issuer),
    sso.clientId,
    sso.clientSecret
  ) : null;

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

    const { email } = userInfo;

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

      token = await createSession(user.id);
    } else {
      const id = uuid();
      await db()<DatabaseUser>('users')
        .insert({
          id,
          email,
          active: true,
          password: await bcrypt.hash(randomBytes(32).toString('base64url'), 10),
          role: sso.defaultRole || 'USER'
        });

      token = await createSession(id);
    }

    res.redirect(`/login#${token}`);
  }));

  return router;
}
