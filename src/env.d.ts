import type { UserWithWebsites } from './common/types/User';

declare global {
  /* eslint-disable no-underscore-dangle */
  const __SNOWCMS_CONFIG_FILE__: string;
  const __SNOWCMS_INPUTS_PLUGIN_CONFIG__: string;
  const __SNOWCMS_HOOKS_PLUGIN_CONFIG__: string;
  const __SNOWCMS_ROUTES_PLUGIN_CONFIG__: string;
  const __SNOWCMS_IS_PRODUCTION__: string;

  namespace Express {
    interface Request {
      user?: UserWithWebsites
    }
  }
}
