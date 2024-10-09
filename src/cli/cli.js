#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import { exists, findPackageRoot } from './util.js';

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

switch (command) {
  case 'build':
    break;
  case 'dev':
    break;
  default:
    throw new Error('Unknown command');
}
