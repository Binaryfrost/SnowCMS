import type { Request } from 'express';
import type { PluginConfig } from '../../config';
import { PluginLogger } from './PluginLogger';
import { PaginatedQueryClient } from '../../lib/client/PaginatedQueryClient';

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

interface Paginated<T> {
  data: T[]
  page: number
  pages: number
}

export async function serverGetAllPagesFetch<T>(req: Request, fn: Fn): Promise<T[]> {
  const result: T[][] = [];
  const query = `limit=100&page=`

  let page = 0;
  let pages = null;

  while (page !== pages) {
    page++;

    const resp: Paginated<T> = await (
      await serverInputFetch(req, (d) => `${fn(d)}?${query}${page}`)
    ).json();

    pages = resp.pages;
    result.push(resp.data);
  }

  return result.flat();
}
