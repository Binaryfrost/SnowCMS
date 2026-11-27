import express from 'express';
import type { ServeStaticOptions } from 'serve-static';
import cookieParser from 'cookie-parser';
import { type NormalizedConfig } from '../config';
import { callHook } from './plugins/hooks';
import devServer from './dev-server';
import { getManifest } from './manifest';
import initDb from './database/db';
import { initConfig } from './config/config';
import initRedis from './database/redis';
import { asyncRouteFix } from './util';
import ExpressError from '../common/errors/base/ExpressError';
import { loadPlugins } from './plugins/plugins';
import { initExpressSentry } from './sentry';
import { UNSAFE_SOURCE_HEADER, CSRF_METHODS } from '../common/constants';

import { router as pluginRouter } from './plugins/routes';
import appRouter from './modules/router';
import { getContainer } from './modules/container';

export async function start(config: NormalizedConfig) {
  initConfig(config);

  loadPlugins();

  console.log('Connecting to database');
  await initDb();

  console.log('Connecting to Redis');
  await initRedis();

  const { services, middleware } = getContainer();
  await services.email.initialize();

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

  app.use(cookieParser());

  const cacheConfig: ServeStaticOptions = __SNOWCMS_IS_PRODUCTION__ ? {
    maxAge: '30d',
    immutable: true
  } : {};
  app.use('/assets', express.static('../client', cacheConfig));

  app.use(express.json({
    limit: '16MB'
  }));

  // Block requests that originated from user-controlled sources (e.g. webhooks, RemoteDataInput)
  app.use(asyncRouteFix(async (req, res, next) => {
    if (req.get(UNSAFE_SOURCE_HEADER)) throw new ExpressError('Forbidden', 403);
    next();
  }));

  app.use('/', appRouter()._getRouter());

  // Plugin routes
  app.use('/c', asyncRouteFix(async (req, res, next) => {
    await middleware.security.authenticate(req, res, next);
  }));
  app.use('/c', asyncRouteFix(async (req, res, next) => {
    if (!CSRF_METHODS.includes(req.method)) {
      next();
      return;
    }

    await middleware.security.csrf(req, res, next);
  }));
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

  initExpressSentry(app);

  // Express expects error handling middleware to have 4 arguments
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err, req, res, next) => {
    const errorResp: Record<string, any> = {
      error: err.message || err.name
    };

    if (!__SNOWCMS_IS_PRODUCTION__ && err.stack) {
      errorResp.stack = err.stack;
    }

    res.status(err.status || 500).json(errorResp);
  });

  app.listen(config.port, () => {
    console.log(`${__SNOWCMS_IS_PRODUCTION__ ? 'Listening' :
      'Dev server listening'} on port ${config.port}`);

    callHook('serverStart', {
      port: config.port
    });
  });
}
