import { registerBuiltInInputs } from './inputs';
import { loadPlugins } from './plugins';

export default async function setup() {
  registerBuiltInInputs();

  if (__SNOWCMS_PLUGIN_CONFIG_FILE__) {
    const pluginConfig = await import(__SNOWCMS_PLUGIN_CONFIG_FILE__);
    console.log(pluginConfig);
    loadPlugins(pluginConfig.default);
  }
}
