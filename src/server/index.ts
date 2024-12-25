import type { NormalizedConfig } from '../config';
import setup from '../common/setup';
import { verifyNodeVersion } from '../version';

verifyNodeVersion();

// eslint-disable-next-line import/no-dynamic-require
const configFile = require(__SNOWCMS_CONFIG_FILE__);
const config: NormalizedConfig = configFile.default;

setup();

// Using a dynamic import forces Webpack to code split the rest of the app
const server = await import('./server');
server.start(config);
