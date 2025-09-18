import type { UserWithWebsites } from './common/types/User';

declare global {
  /* eslint-disable no-underscore-dangle */
  const __SNOWCMS_CONFIG_FILE__: string;
  const __SNOWCMS_INPUTS_PLUGIN_CONFIG__: string;
  const __SNOWCMS_HOOKS_PLUGIN_CONFIG__: string;
  const __SNOWCMS_ROUTES_PLUGIN_CONFIG__: string;
  const __SNOWCMS_IS_PRODUCTION__: string;
  const __SNOWCMS_CLIENT_PUBLIC_PATH__: string | undefined;
  const __SNOWCMS_SENTRY_DSN__: string | undefined;

  namespace Express {
    interface Request {
      user?: UserWithWebsites
    }
  }
}
