import webpack from 'webpack';
import path from 'path';
import { fork } from 'child_process';
import { getWebpackClientConfig, getWebpackServerConfig } from '../webpack.js';
import { exists } from '../util.js';

/** @param {import('../webpack').WebpackOptions} opts */
export async function run(opts) {
  const clientConfig = await getWebpackClientConfig(opts);
  const serverConfig = await getWebpackServerConfig(opts);

  console.log('Running development build');

  const serverJs = path.join(serverConfig.output.path, serverConfig.output.filename);
  /** @type {import('child_process').ChildProcess} */
  let serverProcess;
  async function startServer() {
    if (serverProcess) {
      if (!serverProcess.kill()) {
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
        startServer();
      }
    }
  });
}
