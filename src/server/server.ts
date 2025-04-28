import express from 'express';
import type { ServeStaticOptions } from 'serve-static';
import { type NormalizedConfig } from '../config';
import { callHook } from './plugins/hooks';
import devServer from './dev-server';
import { getManifest } from './manifest';
import initDb from './database/db';
import { initConfig } from './config/config';
import { getApiKey, getSession, getUser } from './database/util';
import initRedis from './database/redis';
import { asyncRouteFix, getAuthToken } from './util';
import { UserWithWebsites } from '../common/types/User';
import { ROLE_HIERARCHY } from '../common/users';
import ExpressError from '../common/ExpressError';
import { loadPlugins } from './plugins/plugins';

import websiteRouter from './routes/website';
import collectionRouter from './routes/collections';
import collectionInputsRouter from './routes/collection-inputs';
import collectionEntriesRouter from './routes/collection-entries';
import mediaRouter from './routes/media';
import accountRouter from './routes/accounts';
import loginRouter from './routes/login';
import { router as pluginRouter } from './plugins/routes';

export async function start(config: NormalizedConfig) {
  initConfig(config);

  loadPlugins();

  console.log('Connecting to database');
  await initDb();

  console.log('Connecting to Redis');
  await initRedis();

  const app = express();

  app.set('trust proxy', config.trustProxy);

  app.use((req, res, next) => {
    res.header('X-Robots-Tag', 'noindex');
    next();
  });

  app.use('/assets', (req, res, next) => {
    if (req.path === '/manifest.json') {
      throw new ExpressError('Forbidden', 403);
    }
    next();
  });

  const cacheConfig: ServeStaticOptions = __SNOWCMS_IS_PRODUCTION__ ? {
    maxAge: '30d',
    immutable: true
  } : {};
  app.use('/assets', express.static('../client', cacheConfig));

  app.use(express.json({
    limit: '16MB'
  }));

  async function getAuthedUser(token: string): Promise<UserWithWebsites> {
    if (!token) return null;

    const isApiKey = token.startsWith('a:');

    if (!isApiKey) {
      const sessionUser = await getSession(token);
      if (!sessionUser) return null;

      const user = await getUser(sessionUser.user);
      return user;
    }

    if (!token.includes('.')) return null;

    const apiToken = token.replace(/^a:/, '');
    const [id, key] = apiToken.split('.');

    const apiKey = await getApiKey(id, key);
    if (!apiKey) return null;

    const apiKeyUser = await getUser(apiKey.userId);
    if (!apiKeyUser) return null;

    if (ROLE_HIERARCHY[apiKey.role] > ROLE_HIERARCHY[apiKeyUser.role]) {
      apiKey.role = apiKeyUser.role;
    }

    if (apiKeyUser.role !== 'ADMIN') {
      apiKey.websites = apiKeyUser.websites.filter((w) => apiKey.websites.includes(w));
    }

    return {
      id: apiKey.id,
      email: 'apikey@snowcms',
      role: apiKey.role,
      active: apiKey.active && apiKeyUser.active,
      websites: apiKey.websites
    };
  }

  app.use(asyncRouteFix(async (req, res, next) => {
    const token = getAuthToken(req);
    const user = await getAuthedUser(token);
    if (user && user.active) {
      req.user = user;
    }

    next();
  }));

  app.use('/api/websites', websiteRouter);
  app.use('/api/websites/:websiteId/collections', collectionRouter);
  app.use('/api/websites/:websiteId/collections/:collectionId/inputs', collectionInputsRouter);
  app.use('/api/websites/:websiteId/collections/:collectionId/entries', collectionEntriesRouter);
  app.use('/api/websites/:websiteId/media', mediaRouter);
  app.use('/api/accounts', accountRouter);
  app.use('/api/login', await loginRouter(config.sso));
  app.use('/c', pluginRouter);

  if (!__SNOWCMS_IS_PRODUCTION__) {
    devServer(config.port + 1);
  }

  app.use('/api/', (req, res) => {
    res.status(404).json({
      error: 'Route not found'
    });
  });

  app.use('/c/', (req, res) => {
    res.status(404).json({
      error: 'Route not found'
    });
  });

  let preConnectUrl: string | undefined;
  if (__SNOWCMS_CLIENT_PUBLIC_PATH__) {
    const u = new URL(__SNOWCMS_CLIENT_PUBLIC_PATH__);
    preConnectUrl = `${u.protocol}//${u.host}`;
    console.log(`Using alternative asset public path ${__SNOWCMS_CLIENT_PUBLIC_PATH__}`);
  }

  // Catch all GET requests that haven't already been handled and serve the CMS SPA
  app.get('*', async (req, res) => {
    const MANIFEST = await getManifest();

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SnowCMS</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${preConnectUrl ? `<link rel="preconnect" href="${preConnectUrl}" />` : ''}
        </head>
        <body>
          <div id="app"></div>
          <script src="${MANIFEST['main.js']}"></script>
          ${!__SNOWCMS_IS_PRODUCTION__ ? `
            <script>
              (() => {
                /*
                  If the protocol is HTTPS, it's probably being accessed
                  through a reverse proxy for development
                */
                if (location.protocol === 'https:') return;

                let unloading = false;
                addEventListener('beforeunload', () => unloading = true);

                const host = \`\${location.protocol === 'http:' ? 'ws' : 'wss'}` +
                  `://\${location.hostname}:${config.port + 1}/dev\`;
                const ws = new WebSocket(host);
                ws.addEventListener('close', () => {
                  if (unloading) return;
                  location.reload()
                });
              })();
            </script>
          ` : ''}
        </body>
      </html>
    `);
  });

  // Express expects error handling middleware to have 4 arguments
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      error: err.message || err.name
    });
  });

  app.listen(config.port, () => {
    console.log(`${__SNOWCMS_IS_PRODUCTION__ ? 'Listening' :
      'Dev server listening'} on port ${config.port}`);

    callHook('serverStart', {
      port: config.port
    });
  });
}
