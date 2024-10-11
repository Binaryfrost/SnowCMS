import express from 'express';

import InputRegistry from '../common/InputRegistry';
import { type NormalizedConfig } from '../config';
import { callHook } from '../common/plugins';

export function start(config: NormalizedConfig) {
  const app = express();

  if (__SNOWCMS_IS_PRODUCTION__) {
    app.use('/assets', express.static('../client'));
  }

  // This is just for testing
  app.get('/api/inputs', (req, res) => {
    const input = InputRegistry.getAllInputs();
    console.log(input);
    res.json(input);
  });

  /*
   * Because the config file is a TypeScript file, it can't be loaded by the CLI
   * so the Webpack dev server config can't adapt to the port being changed.
   */
  const port = __SNOWCMS_IS_PRODUCTION__ ? config.port : 8030;
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);

    callHook('start', {
      addInput: InputRegistry.addInput,
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
