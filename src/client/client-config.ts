import type { NormalizedConfig } from '../config';

// eslint-disable-next-line import/no-dynamic-require
const configFile = require(__SNOWCMS_CONFIG_FILE__);
const config: NormalizedConfig = configFile.default;

export type ClientConfig = Pick<NormalizedConfig, 'plugins'>

// I was hoping this would work, but it still includes the whole config file in the client bundle
const clientConfig: ClientConfig = {
  plugins: config.plugins
};

export default clientConfig;
