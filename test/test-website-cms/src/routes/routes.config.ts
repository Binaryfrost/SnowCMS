import { defineRoutePluginConfig } from '../../../../src/config';
import testRoutes from './test-plugin-routes';

export default defineRoutePluginConfig({
  plugins: [
    testRoutes
  ]
});
