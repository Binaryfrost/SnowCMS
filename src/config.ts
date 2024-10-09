import type { DeepRequired } from 'utility-types';

interface Plugin {
  name: string
  // TODO: Add hook types
  hooks: Record<string, () => void>
}

interface Config {
  port?: number,
  secret: string,
  sso: {
    clientId: string,
    clientSecret: string,
    authUrl: string,
    tokenUrl: string,
    userInfoUrl: string,
    logoutUrl: string
  },
  media: {
    maxSize?: number,
    maxStorage?: number,
    s3: {
      endpoint: string,
      region: string,
      bucket: string,
      accessKeyId: string,
      secretAccessKey: string,
      publicUrl: string
    }
  },
  plugins?: Plugin[]
}

// TODO: Test
export const defineConfig = (config: Config): DeepRequired<Config> => ({
  ...config,
  port: config.port || 8030,
  media: {
    ...config.media,
    maxSize: config.media.maxSize || 50000000,
    maxStorage: config.media.maxStorage || 5000000000
  },
  plugins: config.plugins || []
});
