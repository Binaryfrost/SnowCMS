import { defineConfig } from '../../src/index';
import testPlugin from './test-plugin';

export default defineConfig({
  // Ignored in development
  port: 3080,
  // IMPORTANT: Test the Webpack config to make sure the secret doesn't leak to the client-side code
  secret: 'longrandomsecret',
  sso: {
    clientId: '',
    // See comment above about secret
    clientSecret: '',
    authUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    logoutUrl: ''
  },
  // Future update
  media: {
    // Maximum size of one file
    maxSize: 20000000, // 20 MB (default: 50MB)
    // Per-website maximum storage for all files
    // maxStorage: 5000000000, // 5GB (default)
    s3: {
      endpoint: '',
      region: '',
      // The S3 bucket should be dedicated to SnowCMS
      bucket: '',
      accessKeyId: '',
      // See comment above about secret; ideally none of the S3 config should be available client-side, the necessary URLs should be generated server-side and sent to the client
      secretAccessKey: '',
      publicUrl: ''
    }
  },
  plugins: [
    testPlugin
  ]
});
