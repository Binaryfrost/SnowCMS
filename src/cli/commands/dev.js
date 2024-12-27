import webpack from 'webpack';
import path from 'path';
import fs from 'fs/promises';
import { fork } from 'child_process';
import { getWebpackClientConfig, getWebpackServerConfig } from '../webpack.js';
import { exists } from '../util.js';

/** @param {import('../webpack').WebpackOptions} opts */
export async function run(opts) {
  const clientConfig = await getWebpackClientConfig(opts);
  const serverConfig = await getWebpackServerConfig(opts);

  console.log('Running development build');

  const serverNodeModules = path.join(serverConfig.output.path, 'node_modules');
  if (await exists(serverNodeModules)) {
    try {
      await fs.unlink(serverNodeModules);
    } catch (e) {
      console.error('Failed to delete production node_modules, you may need to delete it ' +
      'manually for the development build to succeed. Error: ', e.message);
    }
  }

  const serverJs = path.join(serverConfig.output.path, serverConfig.output.filename);
  /** @type {import('child_process').ChildProcess} */
  let serverProcess;
  async function startServer(serverHasChanges) {
    if (serverHasChanges || !serverProcess) {
      if (serverProcess) {
        console.log('Restarting dev server');

        if (serverProcess.exitCode === null && !serverProcess.kill()) {
          throw new Error('Failed to restart server');
        }
      }

      if (!(await exists(serverJs))) {
        throw new Error('Server entry file does not exist');
      }

      serverProcess = fork(serverJs, {
        cwd: serverConfig.output.path
      });

      serverProcess.on('error', console.error);
      serverProcess.on('exit', (code) => {
        console.log(`Dev server exited with code ${code}`);
      });
    } else {
      console.log('Reloading frontend');
      serverProcess.send('CLIENT');
    }
  }

  let hash = null;
  webpack([clientConfig, serverConfig]).watch({
    aggregateTimeout: 300,
    ignored: /node_modules/
  }, (err, stats) => {
    if (err) {
      throw err;
    }

    if (hash !== stats.hash) {
      console.log(stats.toString({
        colors: true,
        chunks: false,
        warnings: false,
        warningsCount: false
      }));

      hash = stats.hash;

      if (!stats.hasErrors()) {
        console.log('SnowCMS development build complete');
        const [serverStats] = stats.toJson().children
          .filter((s) => s.outputPath === serverConfig.output.path)
          .map((s) => s.assets.filter((a) => a.emitted))
          .map((s) => s.length > 0);
        startServer(!!serverStats);
      }
    }
  });
}
