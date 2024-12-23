import type { DeepRequired } from 'utility-types';
import type { RedisClientOptions } from 'redis';
import type { Plugin } from './common/plugins';
import type { Role } from './common/types/User';

interface Config {
  /**
   * The port SnowCMS will run on.
   * In dev mode, a WebSocket server will be started on the next consecutive port.
   */
  port?: number
  /**
   * HMAC signing secret
   */
  secret: string
  sso?: {
    clientId: string
    clientSecret: string
    authUrl: string
    tokenUrl: string
    userInfoUrl: string
    logoutUrl: string
    /**
     * If enabled, the login form will be disabled and all logins will be handled using SSO
     */
    forceSso?: boolean
    /**
     * If no account exists in SnowCMS with the user's email,
     * a new one will be created with this role.
     * @default USER
     */
    defaultRole?: Role
  }
  media: {
    /**
     * The maximum size for uploaded files
     * @default 52428800 (50MB)
     */
    maxSize?: number
    /**
     * The maximum storage per website
     * @default 5368709120 (5GB)
     */
    maxStorage?: number
    s3: {
      endpoint: string
      region: string
      bucket: string
      accessKeyId: string
      secretAccessKey: string
      /**
       * The URL that media assets will be accessed through.
       * Ensure that this is publicly accessible without authorization.
       */
      publicUrl: string
    }
  }
  database: {
    host: string
    port?: number
    database: string
    username: string
    password: string
  },
  redis: RedisClientOptions
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

type DeepRequiredExcept<T, K extends keyof T> = DeepRequired<Omit<T, K>> & Pick<T, K>
export type NormalizedConfig = DeepRequiredExcept<Config, 'sso' | 'redis'>

export const defineConfig = (config: Config): NormalizedConfig => ({
  ...config,
  port: config.port || 3080,
  media: {
    ...config.media,
    maxSize: config.media.maxSize || 52428800,
    maxStorage: config.media.maxStorage || 5368709120
  },
  database: {
    ...config.database,
    port: config.database.port || 3306
  }
});

// To provide types in config file
export const definePluginConfig = (config: PluginConfig) => config;
