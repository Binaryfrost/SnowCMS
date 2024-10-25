import type { DeepRequired } from 'utility-types';
import type { Plugin } from './common/plugins';

interface Config {
  port?: number
  secret: string
  sso: {
    clientId: string
    clientSecret: string
    authUrl: string
    tokenUrl: string
    userInfoUrl: string
    logoutUrl: string
  }
  media: {
    maxSize?: number
    maxStorage?: number
    s3: {
      endpoint: string
      region: string
      bucket: string
      accessKeyId: string
      secretAccessKey: string
      publicUrl: string
    }
  }
  database: {
    host: string
    port?: number
    database: string
    username: string
    password: string
  }
}

/*
 * There's no way of preventing Webpack from including the whole config file
 * in the client bundle, so to prevent secrets from being leaked, plugins
 * are loaded in a completely separate config file. It's not an ideal
 * solution, but it works as long as one of the files doesn't import the other.
 */
export interface PluginConfig {
  plugins: Plugin[]
}

export type NormalizedConfig = DeepRequired<Config>

export const defineConfig = (config: Config): NormalizedConfig => ({
  ...config,
  port: config.port || 3080,
  media: {
    ...config.media,
    maxSize: config.media.maxSize || 50000000,
    maxStorage: config.media.maxStorage || 5000000000
  },
  database: {
    ...config.database,
    port: config.database.port || 3306
  }
});

// To provide types in config file
export const definePluginConfig = (config: PluginConfig) => config;
