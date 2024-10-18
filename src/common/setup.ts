import InputRegistry from './InputRegistry';
import { registerBuiltInInputs } from './inputs';
import { callHook, loadPlugins } from './plugins';

export default async function setup() {
  registerBuiltInInputs();

  if (__SNOWCMS_PLUGIN_CONFIG_FILE__) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const pluginConfig = require(__SNOWCMS_PLUGIN_CONFIG_FILE__);
    console.log(pluginConfig.default);
    loadPlugins(pluginConfig.default);

    callHook('setup', {
      addInput: InputRegistry.addInput
    });
  }
}
