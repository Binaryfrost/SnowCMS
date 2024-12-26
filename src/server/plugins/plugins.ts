import loadHooks from './hooks';
import loadRoutes from './routes';

export function loadPlugins() {
  if (__SNOWCMS_HOOKS_PLUGIN_CONFIG__) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const pluginConfig = require(__SNOWCMS_HOOKS_PLUGIN_CONFIG__);
    loadHooks(pluginConfig.default);
  }

  if (__SNOWCMS_ROUTES_PLUGIN_CONFIG__) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const pluginConfig = require(__SNOWCMS_ROUTES_PLUGIN_CONFIG__);
    loadRoutes(pluginConfig.default);
  }
}
