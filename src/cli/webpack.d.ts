import { Configuration } from 'webpack/types';

export interface WebpackOptions {
  userDir: string
  cmsSrcDir: string
  mode: 'development' | 'production'
}

export function getWebpackServerConfig(opts: WebpackOptions): Configuration;
export function getWebpackClientConfig(opts: WebpackOptions): Configuration;
