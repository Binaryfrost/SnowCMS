import webpack from 'webpack';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { nodeFileTrace } from '@vercel/nft';
import { getWebpackClientConfig, getWebpackServerConfig } from '../webpack.js';
import { findNodeModules, findPackageRoot } from '../util.js';

/** @param {import('../webpack').WebpackOptions} opts */
export async function run(opts) {
  const clientConfig = await getWebpackClientConfig(opts);
  const serverConfig = await getWebpackServerConfig(opts);

  console.log('Running production build');

  return new Promise((resolve, reject) => {
    webpack([clientConfig, serverConfig], async (err, stats) => {
      if (err) {
        console.error(err);
        reject();
        return;
      }

      console.log(stats.toString({
        colors: true,
        chunks: false,
        warnings: false,
        warningsCount: false
      }));

      if (stats.hasErrors()) {
        console.error('An error occurred while compiling');
        reject();
        return;
      }

      const packageRoot = await findPackageRoot(fileURLToPath(import.meta.url));
      const entryFile = path.join(serverConfig.output.path, serverConfig.output.filename);

      // https://github.com/withastro/adapters/blob/main/packages/netlify/src/lib/nft.ts
      const result = await nodeFileTrace([entryFile], {
        base: packageRoot
      });

      // eslint-disable-next-line no-restricted-syntax
      for (const error of result.warnings) {
        if (error.message.startsWith('Failed to resolve dependency')) {
          const [, module, file] =
            /Cannot find module '(.+?)' loaded from (.+)/.exec(error.message) || [];

          if (entryFile === file) {
            console.log(
              `The module "${module}" couldn't be resolved. ` +
              'This may not be a problem, but it\'s worth checking.'
            );
          } else {
            console.log(
              `The module "${module}" inside the file "${file}" couldn't be resolved. ` +
              'This may not be a problem, but it\'s worth checking.'
            );
          }
          // eslint-disable-next-line brace-style
        }
        // parse errors are likely not js and can safely be ignored,
        // such as this html file in "main" meant for nw instead of node:
        // https://github.com/vercel/nft/issues/311
        else if (!error.message.startsWith('Failed to parse')) {
          throw error;
        }
      }

      const modules = new Set([...result.fileList]
        .filter((m) => m.startsWith('node_modules'))
        .map((m) => m.split(path.sep).slice(1, 2).join(path.sep)));

      const serverDistNodeModules = path.join(serverConfig.output.path, 'node_modules');
      if (!fs.existsSync(serverDistNodeModules)) {
        fs.mkdirSync(serverDistNodeModules);
        console.log('Created node_modules directory in dist/server');
      }

      const copyFromNodeModules = await findNodeModules(packageRoot);

      console.log('Copying production dependencies');
      console.log('Source node_modules:', copyFromNodeModules);
      console.log('Destination node_modules:', serverDistNodeModules);

      modules.forEach((m) => {
        const from = path.join(copyFromNodeModules, m);
        const to = path.join(serverDistNodeModules, m);
        console.log(`Copying ${m}`);

        fs.cpSync(from, to, {
          recursive: true
        });
      });
      console.log('Copied production dependencies');

      console.log('SnowCMS production build complete');
      resolve();
    });
  });
}
