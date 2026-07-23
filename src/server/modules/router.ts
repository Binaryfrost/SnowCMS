import { getContainer } from './container';
import Route from './router/Route';
import Router from './router/Router';

export default function router() {
  const {
    controllers,
    middleware
  } = getContainer();

  // TODO: Test
  const routes = [
    new Route('GET', '/api/healthcheck').handler(controllers.healthcheck, 'healthcheck')
  ];

  const _router = new Router();
  routes.forEach((route) => _router.registerRoute(route));
  return _router;
}
