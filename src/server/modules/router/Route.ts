import type { RequestHandler } from 'express';
import Controller, { type ControllerMethod } from '../Controller';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export type ControllerMethods<C> = {
  [K in keyof C]: C[K] extends (...args: any[]) => any ?
    Parameters<C[K]> extends Parameters<ControllerMethod> ?
      ReturnType<C[K]> extends ReturnType<ControllerMethod> ?
      K : never
    : never
  : never
}[keyof C];

export default class Route<Path extends string> {
  private method: HttpMethod;
  private path: Path;
  private _handler!: RequestHandler;
  private _middleware: RequestHandler[] = [];

  constructor(method: HttpMethod, path: Path) {
    this.method = method;
    this.path = path;
  }

  handler<C extends Controller>(controller: C, method: ControllerMethods<C>) {
    const h = controller[method] as ControllerMethod;
    this._handler = (req, res) => {
      h.bind(controller)(req, res);
    };
    return this;
  }

  middleware(...middleware: RequestHandler[]) {
    this._middleware.push(...middleware);
    return this;
  }

  _get() {
    return {
      method: this.method,
      path: this.path,
      handler: this._handler,
      middleware: this._middleware
    };
  }
}
