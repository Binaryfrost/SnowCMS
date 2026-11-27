import type { Request, RequestHandler } from 'express';
import { CSRF_METHODS } from '../../../common/constants';
import type { Role } from '../../../common/users';
import { getContainer } from '../container';
import type Controller from '../Controller';
import Route, { ControllerMethods, HttpMethod } from './Route';

export interface RouteAuthorizeOpts {
  role: Role
  websiteId?: string | ((req: Request) => string)
}

export interface RouteOpts {
  /**
   * Whether to attempt authentication for this route. Defaults to true.
   * Set to false for intentionally public routes (e.g. login).
   */
  authenticate?: boolean
  authorize?: RouteAuthorizeOpts
  csrf?: boolean
}

const DEFAULT_OPTS: RouteOpts = {
  authenticate: true,
  csrf: true
};

/**
 * Builds a Route for a Controller method, wiring in the security middleware.
 *
 * Exported so plugins and other callers can define routes using the same
 * authentication, authorization, and CSRF behaviour as the built-in routes.
 * @param method HTTP method
 * @param path Route path
 * @param controller Controller instance
 * @param methodName Controller method to handle the route
 * @param opts Route options
 */
export function route<C extends Controller, P extends string>(
  method: HttpMethod,
  path: P,
  controller: C,
  methodName: ControllerMethods<C>,
  opts: RouteOpts = {}
) {
  const { middleware } = getContainer();
  const { security } = middleware;

  const {
    authenticate,
    authorize,
    csrf
  } = { ...DEFAULT_OPTS, ...opts };

  const mws: RequestHandler[] = [];

  if (authenticate) {
    mws.push(security.authenticate.bind(security));
  }

  if (authorize) {
    mws.push(security.authorize(authorize.role, authorize.websiteId));
  }

  if (csrf && CSRF_METHODS.includes(method)) {
    mws.push(security.csrf.bind(security));
  }

  return new Route<P>(method, path)
    .middleware(...mws)
    .handler(controller, methodName);
}
