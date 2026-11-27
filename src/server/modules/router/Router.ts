import { Router as ExpressRouter } from 'express';
import Route, { HttpMethod } from './Route';
import { asyncRouteFix } from '../../util';

export default class Router {
  private express: ExpressRouter;

  constructor() {
    this.express = ExpressRouter({
      mergeParams: true
    });
  }

  private resolveMethodHandler(method: HttpMethod) {
    switch (method) {
      case 'GET':
        return this.express.get;
      case 'POST':
        return this.express.post;
      case 'PUT':
        return this.express.put;
      case 'PATCH':
        return this.express.patch;
      case 'DELETE':
        return this.express.delete;
      case 'OPTIONS':
        return this.express.options;
      default:
        throw new Error('Invalid HTTP method');
    }
  }

  registerRoute(route: Route<any>) {
    const { method, path, middleware, handler } = route._get();
    const methodHandler = this.resolveMethodHandler(method).bind(this.express);
    methodHandler(path, middleware.map(asyncRouteFix), asyncRouteFix(handler));
  }

  _getRouter() {
    return this.express;
  }
}
