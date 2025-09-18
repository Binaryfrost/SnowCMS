import * as Sentry from '@sentry/react';

const SENTRY_DSN = __SNOWCMS_SENTRY_DSN__;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN
  });
}