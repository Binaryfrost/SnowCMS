import type { DeepRequired } from 'utility-types';
import type { RedisClientOptions } from 'redis';
import type { Plugin } from './common/plugins/plugins';
import type { Role } from './common/types/User';
import { Input } from './common/InputRegistry';
import { Hooks } from './server/plugins/hooks';
import { Route } from './server/plugins/routes';

interface Config {
  /**
   * The port SnowCMS will run on.
   * In dev mode, a WebSocket server will be started on the next consecutive port.
   */
  port?: number
  /**
   * Secret used for signing HMACs and encrypting SSO cookie
   */
  secret: string
  sso?: {
    clientId: string
    clientSecret: string
    issuer: string
    callbackUrl: string
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
  redis: RedisClientOptions,
  trustProxy?: any
}

/*
 * There's no way of preventing Webpack from including the whole config file
 * in the client bundle, so to prevent secrets from being leaked, plugins
 * are loaded in a completely separate config file. It's not an ideal
 * solution, but it works as long as one of the files doesn't import the other.
 */
export interface PluginConfig<T> {
  plugins: Plugin<T>[]
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
  },
  trustProxy: false
});

// To provide types in config file
export const defineInputPluginConfig = (config: PluginConfig<Input<any>>) => config;
export function defineInputPlugin<T = any, S = any>(plugin: Plugin<Input<T, S>>) {
  return plugin;
}

export const defineHookPluginConfig = (config: PluginConfig<Hooks>) => config;
export function defineHookPlugin(plugin: Plugin<Hooks>) {
  return plugin;
}

export const defineRoutePluginConfig = (config: PluginConfig<Route>) => config;
export function defineRoutePlugin(plugin: Plugin<Route>) {
  return plugin;
}
