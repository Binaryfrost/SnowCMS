import webpack from 'webpack';
import { getWebpackClientConfig, getWebpackServerConfig } from '../webpack.js';

/** @param {import('../webpack').WebpackOptions} opts */
export async function run(opts) {
  const clientConfig = await getWebpackClientConfig(opts);
  const serverConfig = await getWebpackServerConfig(opts);

  console.log('Running development build');

  let hash = null;
  webpack([clientConfig, serverConfig]).watch({
    aggregateTimeout: 300
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
      }
    }
  });

  // TODO: Finish the rest of the dev command

  /*
   * - Run dev build in watch mode
   * - Add config to watched files
   * - Run built SnowCMS server
   * - Whenever a rebuild is finished due to a change outside
   *   the `client` directory, restart SnowCMS server
   */
}
