// @ts-check
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  env: {
    schema: {
      CMS_API: envField.string({ context: 'server', access: 'secret' }),
      CMS_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      CMS_WEBSITE: envField.string({ context: 'server', access: 'secret' }),
      CMS_COLLECTION: envField.string({ context: 'server', access: 'secret' }),
      CMS_RENDER_HTML: envField.boolean({ context: 'server', access: 'secret' })
    }
  },
  devToolbar: {
    enabled: false
  }
});
