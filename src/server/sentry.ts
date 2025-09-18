import * as Sentry from '@sentry/node';
import type { Express } from 'express';

const SENTRY_DSN = __SNOWCMS_SENTRY_DSN__;

export default function init() {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN
  });
}

export function initExpressSentry(app: Express) {
  if (!SENTRY_DSN) return;
  Sentry.setupExpressErrorHandler(app);
}