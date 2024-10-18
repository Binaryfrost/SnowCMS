import fs from 'fs/promises';
import express from 'express';

import InputRegistry from '../common/InputRegistry';
import { type NormalizedConfig } from '../config';
import { callHook } from '../common/plugins';
import devServer from './dev-server';

const MANIFEST: Record<string, string> = JSON.parse(await fs.readFile('../client/manifest.json', {
  encoding: 'utf8'
}));

export function start(config: NormalizedConfig) {
  const app = express();
  // TODO: Caching in production
  app.use('/assets', express.static('../client'));

  // This is just for testing
  app.get('/api/inputs', (req, res) => {
    const input = InputRegistry.getAllInputs();
    console.log(input);
    res.json(input);
  });

  if (!__SNOWCMS_IS_PRODUCTION__) {
    devServer(config.port + 1);
  }

  // Catch all GET requests that haven't already been handled and serve the CMS SPA
  app.get('*', (req, res) => {
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
      registerRoute: (path, role) => {
        if (role) {
          app.use(path, (req, res) => {
            // TODO: Add role checking
            res.status(403).json({
              error: 'User role does not have access to that route'
            });
          });
        }

        return app.route(path);
      }
    });
  });
}
