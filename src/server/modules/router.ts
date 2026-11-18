import type { RequestHandler } from 'express';
import { getContainer } from './container';
import Route, { HttpMethod } from './router/Route';
import Router from './router/Router';
import { CSRF_METHODS } from '../../common/constants';

// Route table formatting is intentionally inconsistent to keep entries compact
/* eslint-disable function-call-argument-newline */

interface AuthorizeOpts {
  role: 'VIEWER' | 'USER' | 'SUPERUSER' | 'ADMIN'
  websiteId?: string | ((req) => string)
}

interface RouteOpts {
  authorize?: AuthorizeOpts
  csrf?: boolean
}

export default function router() {
  const {
    controllers,
    middleware
  } = getContainer();

  const route = (
    method: HttpMethod,
    path: string,
    controller: any,
    methodName: string,
    opts: RouteOpts = {}
  ) => {
    const mws: RequestHandler[] = [middleware.security.authenticate];

    if (opts.authorize) {
      mws.push(middleware.security.authorize(opts.authorize.role, opts.authorize.websiteId));
    }

    if (opts.csrf !== false && CSRF_METHODS.includes(method)) {
      mws.push(middleware.security.csrf);
    }

    return new Route<any>(method, path)
      .middleware(...mws)
      .handler(controller, methodName);
  };

  const websiteId = (req) => req.params.websiteId;

  const routes: Route<any>[] = [
    route('GET', '/api/healthcheck', controllers.healthcheck, 'healthcheck', { csrf: false }),

    // Login
    route('POST', '/api/login', controllers.login, 'login', { csrf: false }),
    route('GET', '/api/login/config', controllers.login, 'getConfig', { csrf: false }),
    route('GET', '/api/login/logout', controllers.login, 'logout', { csrf: false }),
    route('GET', '/api/login/sso', controllers.login, 'sso', { csrf: false }),
    route('GET', '/api/login/sso/callback', controllers.login, 'ssoCallback', { csrf: false }),
    route('POST', '/api/login/password-reset', controllers.login, 'requestPasswordReset', {
      csrf: false
    }),
    route('GET', '/api/login/password-reset/:token', controllers.login, 'validatePasswordResetToken', {
      csrf: false
    }),
    route('POST', '/api/login/password-reset/:token', controllers.login, 'resetPassword', {
      csrf: false
    }),

    // Config
    route('GET', '/api/config/timezones', controllers.config, 'getTimezones', {
      authorize: {
        role: 'VIEWER'
      }
    }),

    // Security
    route('POST', '/api/security/ssrf/check-url', controllers.security, 'checkUrl', {
      authorize: {
        role: 'VIEWER'
      }
    }),

    // Assets
    route('GET', '/api/assets/email-logo', controllers.asset, 'getEmailLogo', { csrf: false }),

    // Accounts
    route('GET', '/api/accounts', controllers.user, 'getAll', {
      authorize: {
        role: 'ADMIN'
      }
    }),
    route('POST', '/api/accounts', controllers.user, 'create', {
      authorize: {
        role: 'ADMIN'
      }
    }),
    route('GET', '/api/accounts/me', controllers.user, 'getMe'),
    route('GET', '/api/accounts/:userId', controllers.user, 'get'),
    route('PUT', '/api/accounts/:userId', controllers.user, 'update'),
    route('DELETE', '/api/accounts/:userId', controllers.user, 'delete', {
      authorize: {
        role: 'ADMIN'
      }
    }),

    // API Keys
    route('GET', '/api/accounts/:userId/keys', controllers.apiKey, 'getAll'),
    route('POST', '/api/accounts/:userId/keys', controllers.apiKey, 'create'),
    route('GET', '/api/accounts/:userId/keys/:keyId', controllers.apiKey, 'get'),
    route('PUT', '/api/accounts/:userId/keys/:keyId', controllers.apiKey, 'update'),
    route('POST', '/api/accounts/:userId/keys/:keyId/reset', controllers.apiKey, 'reset'),
    route('DELETE', '/api/accounts/:userId/keys/:keyId', controllers.apiKey, 'delete'),

    // Websites
    route('GET', '/api/websites', controllers.website, 'getAll', {
      authorize: {
        role: 'VIEWER'
      }
    }),
    route('POST', '/api/websites', controllers.website, 'create', {
      authorize: {
        role: 'ADMIN'
      }
    }),
    route('GET', '/api/websites/:id', controllers.website, 'get', {
      authorize: {
        role: 'VIEWER',
        websiteId: (req) => req.params.id
      }
    }),
    route('PUT', '/api/websites/:id', controllers.website, 'update', {
      authorize: {
        role: 'SUPERUSER',
        websiteId: (req) => req.params.id
      }
    }),
    route('DELETE', '/api/websites/:id', controllers.website, 'delete', {
      authorize: {
        role: 'ADMIN'
      }
    }),

    // Collections
    route('GET', '/api/websites/:websiteId/collections', controllers.collection, 'getAll', {
      authorize: {
        role: 'VIEWER',
        websiteId
      }
    }),
    route('POST', '/api/websites/:websiteId/collections', controllers.collection, 'create', {
      authorize: {
        role: 'SUPERUSER',
        websiteId
      }
    }),
    route('GET', '/api/websites/:websiteId/collections/:id', controllers.collection, 'get', {
      authorize: {
        role: 'VIEWER',
        websiteId
      }
    }),
    route('PUT', '/api/websites/:websiteId/collections/:id', controllers.collection, 'update', {
      authorize: {
        role: 'SUPERUSER',
        websiteId
      }
    }),
    route('DELETE', '/api/websites/:websiteId/collections/:id', controllers.collection, 'delete', {
      authorize: {
        role: 'SUPERUSER',
        websiteId
      }
    }),

    // Collection Inputs
    route('GET', '/api/websites/:websiteId/collections/:collectionId/inputs',
      controllers.collectionInput, 'getAll', {
        authorize: {
          role: 'VIEWER',
          websiteId
        }
      }),
    route('POST', '/api/websites/:websiteId/collections/:collectionId/inputs',
      controllers.collectionInput, 'create', {
        authorize: {
          role: 'SUPERUSER',
          websiteId
        }
      }),
    route('PATCH', '/api/websites/:websiteId/collections/:collectionId/inputs/:id/order',
      controllers.collectionInput, 'reorder', {
        authorize: {
          role: 'SUPERUSER',
          websiteId
        }
      }),
    route('PUT', '/api/websites/:websiteId/collections/:collectionId/inputs/:id',
      controllers.collectionInput, 'update', {
        authorize: {
          role: 'SUPERUSER',
          websiteId
        }
      }),
    route('DELETE', '/api/websites/:websiteId/collections/:collectionId/inputs/:id',
      controllers.collectionInput, 'delete', {
        authorize: {
          role: 'SUPERUSER',
          websiteId
        }
      }),

    // Collection Entries
    route('GET', '/api/websites/:websiteId/collections/:collectionId/entries',
      controllers.collectionEntry, 'getAll', {
        authorize: {
          role: 'VIEWER',
          websiteId
        }
      }),
    route('POST', '/api/websites/:websiteId/collections/:collectionId/entries',
      controllers.collectionEntry, 'create', {
        authorize: {
          role: 'USER',
          websiteId
        }
      }),
    route('GET', '/api/websites/:websiteId/collections/:collectionId/entries/slug/*',
      controllers.collectionEntry, 'getBySlug', {
        authorize: {
          role: 'VIEWER',
          websiteId
        }
      }),
    route('GET', '/api/websites/:websiteId/collections/:collectionId/entries/:id',
      controllers.collectionEntry, 'get', {
        authorize: {
          role: 'VIEWER',
          websiteId
        }
      }),
    route('PATCH', '/api/websites/:websiteId/collections/:collectionId/entries/:id',
      controllers.collectionEntry, 'update', {
        authorize: {
          role: 'USER',
          websiteId
        }
      }),
    route('DELETE', '/api/websites/:websiteId/collections/:collectionId/entries/:id',
      controllers.collectionEntry, 'delete', {
        authorize: {
          role: 'USER',
          websiteId
        }
      }),

    // Collection Entry Drafts
    route('GET', '/api/websites/:websiteId/collections/:collectionId/drafts',
      controllers.collectionEntryDraft, 'getAll', {
        authorize: {
          role: 'VIEWER',
          websiteId
        }
      }),
    route('POST', '/api/websites/:websiteId/collections/:collectionId/drafts',
      controllers.collectionEntryDraft, 'create', {
        authorize: {
          role: 'USER',
          websiteId
        }
      }),
    route('GET', '/api/websites/:websiteId/collections/:collectionId/drafts/:id',
      controllers.collectionEntryDraft, 'get', {
        authorize: {
          role: 'VIEWER',
          websiteId
        }
      }),
    route('PUT', '/api/websites/:websiteId/collections/:collectionId/drafts/:id',
      controllers.collectionEntryDraft, 'update', {
        authorize: {
          role: 'USER',
          websiteId
        }
      }),
    route('DELETE', '/api/websites/:websiteId/collections/:collectionId/drafts/:id',
      controllers.collectionEntryDraft, 'delete', {
        authorize: {
          role: 'USER',
          websiteId
        }
      }),

    // Media
    route('GET', '/api/websites/:websiteId/media', controllers.media, 'getAll', {
      authorize: {
        role: 'VIEWER',
        websiteId
      }
    }),
    route('GET', '/api/websites/:websiteId/media/config', controllers.media, 'getConfig', {
      authorize: {
        role: 'VIEWER',
        websiteId
      }
    }),
    route('POST', '/api/websites/:websiteId/media/upload', controllers.media, 'upload', {
      authorize: {
        role: 'USER',
        websiteId
      }
    }),
    route('POST', '/api/websites/:websiteId/media/upload/confirm',
      controllers.media, 'confirmUpload', {
        authorize: {
          role: 'USER',
          websiteId
        }
      }),
    route('GET', '/api/websites/:websiteId/media/:id', controllers.media, 'get', {
      authorize: {
        role: 'VIEWER',
        websiteId
      }
    }),
    route('DELETE', '/api/websites/:websiteId/media/:id', controllers.media, 'delete', {
      authorize: {
        role: 'USER',
        websiteId
      }
    })
  ];

  const _router = new Router();
  routes.forEach((r) => _router.registerRoute(r));
  return _router;
}
