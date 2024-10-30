import express from 'express';
import InputRegistry from '../common/InputRegistry';
import { type NormalizedConfig } from '../config';
import { callHook } from '../common/plugins';
import devServer from './dev-server';
import { getManifest } from './manifest';
import initDb from './database/db';
import { hasAccess } from '../common/users';

import websiteRouter from './routes/website';
import collectionRouter from './routes/collections';
import collectionInputsRouter from './routes/collection-inputs';

export async function start(config: NormalizedConfig) {
  console.log('Connecting to database');
  await initDb(config);

  const app = express();
  // TODO: Caching in production
  app.use('/assets', express.static('../client'));
  app.use(express.json());

  app.use((req, res, next) => {
    // TODO: Read JWT from header
    req.user = Object.freeze({
      role: 'ADMIN',
      websites: []
    });

    next();
  });

  app.use('/api/websites', websiteRouter);
  app.use('/api/websites/:websiteId/collections', collectionRouter);
  app.use('/api/websites/:websiteId/collections/:collectionId/inputs', collectionInputsRouter);

  if (!__SNOWCMS_IS_PRODUCTION__) {
    devServer(config.port + 1);
  }

  callHook('serverSetup', {
    registerRoute: (path, role) => {
      if (role) {
        app.use(path, (req, res, next) => {
          // TODO: Add role checking
          if (!hasAccess(req.user, role)) {
            res.status(403).json({
              error: 'User role does not have access to that route'
            });

            return;
          }

          next();
        });
      }

      return app.route(path);
    }
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
              const host = \`\${location.protocol === 'http:' ? 'ws' : 'wss'}` +
                `://\${location.hostname}:${config.port + 1}/dev\`;
              const ws = new WebSocket(host);
              ws.addEventListener('close', () => location.reload());
            </script>
          ` : ''}
        </body>
      </html>
    `);
  });

  app.listen(config.port, () => {
    console.log(`${__SNOWCMS_IS_PRODUCTION__ ? 'Listening' :
      'Dev server listening'} on port ${config.port}`);

    callHook('serverStart', {
      port: config.port
    });
  });
}
