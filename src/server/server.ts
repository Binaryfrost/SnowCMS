import express from 'express';
import { type NormalizedConfig } from '../config';
import { callHook } from '../common/plugins';
import devServer from './dev-server';
import { getManifest } from './manifest';
import initDb from './database/db';
import { initConfig } from './config/config';

import websiteRouter from './routes/website';
import collectionRouter from './routes/collections';
import collectionInputsRouter from './routes/collection-inputs';
import collectionTitleRouter from './routes/collection-titles';
import collectionEntriesRouter from './routes/collection-entries';
import mediaRouter from './routes/media';

export async function start(config: NormalizedConfig) {
  initConfig(config);

  console.log('Connecting to database');
  await initDb();

  const app = express();
  // TODO: Caching in production
  app.use('/assets', express.static('../client'));
  app.use(express.json({
    limit: '16MB'
  }));

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
  app.use('/api/websites/:websiteId/collections/:collectionId/title', collectionTitleRouter);
  app.use('/api/websites/:websiteId/collections/:collectionId/entries', collectionEntriesRouter);
  app.use('/api/websites/:websiteId/media', mediaRouter);

  if (!__SNOWCMS_IS_PRODUCTION__) {
    devServer(config.port + 1);
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
