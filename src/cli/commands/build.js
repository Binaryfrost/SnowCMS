import webpack from 'webpack';
import { getWebpackClientConfig, getWebpackServerConfig } from '../webpack.js';

/** @param {import('../webpack').WebpackOptions} opts */
export function run(opts) {
  const clientConfig = getWebpackClientConfig(opts);
  const serverConfig = getWebpackServerConfig(opts);

  console.log('client', clientConfig);
  console.log('server', serverConfig);

  webpack([clientConfig, serverConfig], (err, stats) => {
    if (err) {
      throw err;
    }

    if (stats.hasErrors()) {
      console.error('Error(s) occurred:');
      stats.stats.forEach((s) => s.compilation.errors.forEach((e) => console.error(e)));
      return;
    }

    console.log('SnowCMS production build complete');
  });
}
