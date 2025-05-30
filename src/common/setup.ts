import { registerBuiltInInputs } from './inputs';
import loadInputs from './plugins/inputs';

let setupComplete = false;

export default function setup() {
  if (setupComplete) return;

  registerBuiltInInputs();

  if (__SNOWCMS_INPUTS_PLUGIN_CONFIG__) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const pluginConfig = require(__SNOWCMS_INPUTS_PLUGIN_CONFIG__);
    loadInputs(pluginConfig.default);
  }

  setupComplete = true;
}
