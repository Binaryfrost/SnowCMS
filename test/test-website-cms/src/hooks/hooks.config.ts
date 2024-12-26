import { defineHookPluginConfig } from '../../../../src/config';
import testHooks from './test-plugin-hooks';

export default defineHookPluginConfig({
  plugins: [
    testHooks
  ]
});
