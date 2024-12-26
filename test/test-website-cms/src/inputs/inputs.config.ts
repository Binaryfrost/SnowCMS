import { defineInputPluginConfig } from '../../../../src/config';
import testPluginAlert from './test-plugin-alert';
import testPluginJson from './test-plugin-json';

export default defineInputPluginConfig({
  plugins: [
    testPluginAlert,
    testPluginJson
  ]
});
