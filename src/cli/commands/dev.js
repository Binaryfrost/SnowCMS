/** @param {import('../webpack').WebpackOptions} opts */
export async function run(opts) {
  const clientConfig = await getWebpackClientConfig(opts);
  const serverConfig = await getWebpackServerConfig(opts);

  console.log('client', clientConfig);
  console.log('server', serverConfig);

  /*
   * - Run dev build in watch mode
   * - Add config to watched files
   * - Run built SnowCMS server
   * - Whenever a rebuild is finished due to a change outside
   *   the `client` directory, restart SnowCMS server
   */
}
