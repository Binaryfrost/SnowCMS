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
  sso: {
    clientId: process.env.SSO_CLIENT_ID,
    // See comment above about secret
    clientSecret: process.env.SSO_CLIENT_SECRET,
    authUrl: process.env.SSO_AUTH_URL,
    tokenUrl: process.env.SSO_TOKEN_URL,
    userInfoUrl: process.env.SSO_USER_INFO_URL,
    logoutUrl: process.env.SSO_LOGOUT_URL
  },
  // Future update
  media: {
    // Maximum size of one file
    maxSize: 20000000, // 20 MB (default: 50MB)
    // Per-website maximum storage for all files
    // maxStorage: 5000000000, // 5GB (default)
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
  }
});
