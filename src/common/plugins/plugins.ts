import { Request } from 'express';
import type { PluginConfig } from '../../config';
import { PluginLogger } from './PluginLogger';

export type PluginTypes = 'inputs' | 'hooks' | 'routes';

export interface PluginParam {
  logger: PluginLogger
}

type PluginFn<T> = (p: PluginParam) => T;

export type Plugin<T> = {
  name: string,
  plugin: PluginFn<T> | PluginFn<T>[]
}

export function validatePluginName(name: string, type: PluginTypes) {
  if (!name.match(/^[0-9A-Za-z\-_]+$/)) {
    console.error(`Failed to load plugin ${type}/${name}. ` +
      'Plugin name must be alpha-numeric and may contain a hyphen or underscore.');
    return false;
  }

  return true;
}

/*
 * TODO: Change how plugins are structured
 * Instead of having snowcms-plugins.config.ts, have the following
 * directories in a `src` directory relative to the main config file:
 * - hooks: Server-side hooks
 * - inputs: Inputs (shared between client and server)
 * - routes: Server-side routes
 *
 * All directories, including parent `src` directory are optional.
 *
 * Having this structure allows the custom routes feature to be added back to the CMS while
 * preventing secrets from leaking to the client-side (as the client-side code will never
 * load routes with this file structure). Additionally, because there's no chance of the routes
 * ending up in the client bundle, the routes can be given access to the database and config which
 * significantly increases their usefulness. The same is true for hooks.
 *
 * Care still needs to be taken to ensure Inputs don't leak data. For this reason, all server-side
 * plugin methods should be exported from a different file (e.g. import x from `snowcms/server`).
 *
 * The files in these directories do not need to be named according to the hook/route/input names.
 * The developer is free to choose their own names for these files as long as they are alphanumeric
 * and have a `.ts` extension. Each directory will have a {dir}.config.ts file that imports the
 * plugin files.
 *
 * Each file exports an array of the appropriate data structure (e.g. files in the inputs directory
 * will export an array of Inputs).
 *
 * Code for loading custom inputs will stay in this file (but will be renamed),
 * code for hooks and routes will be in the server directory.
 */

export function loadPlugins<T>(config: PluginConfig<T>, type: PluginTypes,
  cb: (plugin: T) => void) {
  config.plugins.forEach((plugin) => {
    if (!validatePluginName(plugin.name, type)) return;

    const pluginName = `${type}/${plugin.name}`;

    const logger = new PluginLogger(pluginName);

    if (Array.isArray(plugin.plugin)) {
      plugin.plugin.forEach((p) => {
        cb(p({ logger }));
      });
    } else {
      cb(plugin.plugin({ logger }));
    }

    console.log(`Loaded plugin ${pluginName}`);
  });
}

type Fn = ({ websiteId, collectionId }: { websiteId: string, collectionId: string }) => string;

// It isn't ideal, but it works.
/**
 * As Inputs are shared between the server and client, attempting to access the database
 * directly breaks the build. To get around that, use this function to send an HTTP request to server
 * from itself with the user's auth token to get information about the image.
 *
 * Example:
 * ```js
 * const resp = await serverInputFetch(req, ({ websiteId }) => `/api/websites/${websiteId}/media/1234`);
 * if (resp.status !== 200) {
 *  // Handle error
 * }
 * const respData = await resp.json();
 * // Use response data
 * ```
 */
export async function serverInputFetch(req: Request, fn: Fn) {
  const { websiteId, collectionId } = req.params;
  const { authorization } = req.headers;
  const port = req.socket.localPort;

  const apiPath = fn({ websiteId, collectionId });
  const url = new URL(apiPath, `http://localhost:${port}`);

  return fetch(url, {
    headers: {
      authorization
    }
  });
}
