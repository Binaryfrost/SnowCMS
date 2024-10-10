#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import { exists, findPackageRoot } from './util.js';
import * as BuildCommand from './commands/build.js';

const command = process.argv.slice(2)[0];

const userDir = process.cwd();
const cmsSrcDir = await findPackageRoot(fileURLToPath(import.meta.url));

console.log('CMS user directory:', userDir);
console.log('CMS installation directory:', cmsSrcDir);

if (userDir === cmsSrcDir) {
  throw new Error(
    'The SnowCMS CLI commands cannot be run from the CMS source directory. ' +
    'Create a new directory containing your config file and plugins, ' +
    'and then run the CLI command from there.'
  );
}

const configFile = path.join(userDir, 'snowcms.config.ts');
if (!(await exists(configFile))) throw new Error('Could not find SnowCMS config file');

const pluginConfigFile = path.join(userDir, 'snowcms-plugins.config.ts');

switch (command) {
  case 'build':
    await BuildCommand.run({
      cmsSrcDir,
      userDir,
      mode: 'production',
      configPath: configFile,
      pluginConfigPath: await exists(pluginConfigFile) ? pluginConfigFile : null
    });
    break;
  case 'dev':
    break;
  default:
    throw new Error('Unknown command');
}
