import express from 'express';
import { type NormalizedConfig } from '../config';
import { callHook } from '../common/plugins';
import devServer from './dev-server';
import { getManifest } from './manifest';
import initDb from './database/db';
import { initConfig } from './config/config';
import { getSession, getUser, handleUserBooleanConversion } from './database/util';

import websiteRouter from './routes/website';
import collectionRouter from './routes/collections';
import collectionInputsRouter from './routes/collection-inputs';
import collectionTitleRouter from './routes/collection-titles';
import collectionEntriesRouter from './routes/collection-entries';
import mediaRouter from './routes/media';
import accountRouter from './routes/accounts';
import loginRouter from './routes/login';
import initRedis, { redis } from './database/redis';
import { asyncRouteFix } from './util';

export async function start(config: NormalizedConfig) {
  initConfig(config);

  console.log('Connecting to database');
  await initDb();

  console.log('Connecting to Redis');
  await initRedis();

  const app = express();
  // TODO: Caching in production
  app.use('/assets', express.static('../client'));
  app.use(express.json({
    limit: '16MB'
  }));

  app.use(asyncRouteFix(async (req, res, next) => {
    // TODO: Read token from header and get from Redis/MySQL
    // TODO: If the API key has a higher role than the user or websites that the user doesn't have access to, limit the API key to the user's role/websites
    // TODO: Don't set the user object if the account or API key is not active (also check API key's user active value)
    /*req.user = Object.freeze(handleUserBooleanConversion({
      id: '1234',
      email: 'testing@snowcms',
      active: true,
      role: 'ADMIN',
      websites: []
    }));*/

    const { authorization } = req.headers;
    if (!authorization || !authorization.includes(':')) {
      next();
      return;
    }

    const authHeaderParts = authorization.split(' ');
    if (authHeaderParts.length < 2 || authHeaderParts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = authHeaderParts[1];
    const isApiKey = authorization.startsWith('apikey:');

    console.log(token);

    if (!isApiKey) {
      const sessionUser = await getSession(token);
      console.log(sessionUser);
      if (sessionUser) {
        const user = await getUser(sessionUser);
        if (user) {
          req.user = Object.freeze(user);
        }
      }
    } else {
      // TODO: API keys
    }

    next();
  }));

  app.use('/api/websites', websiteRouter);
  app.use('/api/websites/:websiteId/collections', collectionRouter);
  app.use('/api/websites/:websiteId/collections/:collectionId/inputs', collectionInputsRouter);
  app.use('/api/websites/:websiteId/collections/:collectionId/title', collectionTitleRouter);
  app.use('/api/websites/:websiteId/collections/:collectionId/entries', collectionEntriesRouter);
  app.use('/api/websites/:websiteId/media', mediaRouter);
  app.use('/api/accounts', accountRouter);
  app.use('/api/login', loginRouter);

  if (!__SNOWCMS_IS_PRODUCTION__) {
    devServer(config.port + 1);
  }

  app.use('/api/', (req, res) => {
    res.status(404).json({
      error: 'Route not found'
    });
  });

  // Catch all GET requests that haven't already been handled and serve the CMS SPA
  app.get('*', async (req, res) => {
    const MANIFEST = await getManifest();

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SnowCMS</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
                const host = \`\${location.protocol === 'http:' ? 'ws' : 'wss'}` +
                  `://\${location.hostname}:${config.port + 1}/dev\`;
                const ws = new WebSocket(host);
                ws.addEventListener('close', () => location.reload());
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
      error: `${err.name}: ${err.message}`
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
