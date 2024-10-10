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

  app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}`);

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
