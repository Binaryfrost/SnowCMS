import type { User } from './common/types/User';

declare global {
  /* eslint-disable no-underscore-dangle */
  const __SNOWCMS_CONFIG_FILE__: string;
  const __SNOWCMS_PLUGIN_CONFIG_FILE__: string;
  const __SNOWCMS_IS_PRODUCTION__: string;
  const SNOWCMS_PUBLIC__SIDE: 'CLIENT' | 'SERVER';

  namespace Express {
    interface Request {
      user?: User
    }
  }
}
