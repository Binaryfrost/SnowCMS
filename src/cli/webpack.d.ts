import { Configuration } from 'webpack/types';

export interface WebpackOptions {
  userDir: string
  cmsSrcDir: string
  mode: 'development' | 'production'
  configPath: string
  pluginConfigPath?: string
}

export function getWebpackServerConfig(opts: WebpackOptions): Promise<Configuration>;
export function getWebpackClientConfig(opts: WebpackOptions): Promise<Configuration>;
