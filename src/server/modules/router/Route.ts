import type { RequestHandler } from 'express';
import Controller, { type ControllerMethod } from '../Controller';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export default class Route<Path extends string> {
  private method: HttpMethod;
  private path: Path;
  private _handler!: RequestHandler;
  private _middleware: RequestHandler[] = [];

  constructor(method: HttpMethod, path: Path) {
    this.method = method;
    this.path = path;
  }

  handler(controller: Controller, method: string) {
    const h = (controller as any)[method] as ControllerMethod;
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

// TODO: Remove
/* class TestController extends Controller {
  getTest(req: Request, res: Response) {}

  test() {}

  test2(req: Request) {}
}
const controller = new TestController();
const route = new Route('GET', '/test').handler(controller, 'getTest'); */
