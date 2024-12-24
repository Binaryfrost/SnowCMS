import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { defineConfig } from '../../src/index';

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env')
});

export default defineConfig({
  port: 3080,
  // IMPORTANT: Test the Webpack config to make sure the secret doesn't leak to the client-side code
  secret: 'longrandomsecret',
  sso: process.env.SSO_CLIENT_ID ? {
    clientId: process.env.SSO_CLIENT_ID,
    // See comment above about secret
    clientSecret: process.env.SSO_CLIENT_SECRET,
    issuer: process.env.SSO_ISSUER,
    callbackUrl: process.env.SSO_CALLBACK_URL,
  } : undefined,
  media: {
    // Maximum size of one file
    maxSize: 20971520, // 20 MB (default: 50MB)
    // Per-website maximum storage for all files
    // maxStorage: 5368709120, // 5GB (default)
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      // The S3 bucket should be dedicated to SnowCMS
      bucket: process.env.S3_BUCKET,
      accessKeyId: process.env.S3_ACCESS_KEY,
      // See comment above about secret; ideally none of the S3 config should be available client-side, the necessary URLs should be generated server-side and sent to the client
      secretAccessKey: process.env.S3_SECRET_KEY,
      publicUrl: process.env.S3_PUBLIC_URL
    }
  },
  database: {
    host: '127.0.0.1',
    database: 'snowcms',
    username: 'snowcms',
    password: 'snowcms'
  },
  redis: {
    socket: {
      host: '127.0.0.1'
    }
  }
});
