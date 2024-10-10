import type { NormalizedConfig } from '../config';
import setup from '../common/setup';

// eslint-disable-next-line import/no-dynamic-require
const configFile = require(__SNOWCMS_CONFIG_FILE__);
const config: NormalizedConfig = configFile.default;
console.log(config);

setup();

// Using a dynamic import forces Webpack to code split the rest of the app
const server = await import('./server');
server.start(config);
