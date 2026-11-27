import type { Request } from 'express';
import type { PluginConfig } from '../../config';
import Logger from '../Logger';
import { PaginatedQueryClient } from '../../lib/client/PaginatedQueryClient';
import RequestContext, { CollectionRequestContext, WebsiteRequestContext } from '../RequestContext';

export type PluginTypes = 'inputs' | 'hooks' | 'routes';

export interface PluginParam {
  logger: Logger
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

    const logger = new Logger(pluginName);

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

interface Opts {
  method?: 'GET' | 'POST',
  body?: string
}

// It isn't ideal, but it works. This is temporary and will be removed in a future version.
/**
 * As Inputs are shared between the server and client, attempting to access the database
 * directly breaks the build or leaks sensitive configuration. To get around that, use this
 * function to send an HTTP request to server from itself with the user's auth token to
 * get information about the image.
 *
 * Example:
 * ```js
 * const resp = await serverInputFetch(req, `/api/websites/${req.params.websiteId}/media/1234`);
 * if (resp.status !== 200) {
 *  // Handle error
 * }
 * const respData = await resp.json();
 * // Use response data
 * ```
 * @param req
 * @param apiPath
 * @param opts
 */
export async function serverInputFetch<R extends RequestContext<any>>(req: R, apiPath: string, opts: Opts = { method: 'GET' }) {
  const port = req._localPort;
  const url = new URL(apiPath, `http://localhost:${port}`);

  const { auth } = req;
  const headers = new Headers({
    accept: 'application/json'
  });
  if (auth?.type === 'header') {
    headers.append('authorization', auth.auth);
  } else if (auth?.type === 'cookie') {
    headers.append('cookie', auth.cookie);
  }

  if (opts.body) {
    headers.append('content-type', 'application/json');
  }

  return fetch(url, {
    headers,
    method: opts.method,
    body: opts.body
  });
}

interface Paginated<T> {
  _metadata: {
    page: number
    pages: number
  }
  [listKey: string]: T[] | { page: number, pages: number }
}

export async function serverGetAllPagesFetch<T, R extends RequestContext<any> = RequestContext<any>>(
  req: R,
  apiPath: string,
  listKey: string
): Promise<T[]> {
  const result: T[][] = [];
  const query = 'limit=100&page=';

  let page = 0;
  let pages: number | null = null;

  while (page !== pages) {
    page += 1;

    // eslint-disable-next-line no-await-in-loop
    const resp = await serverInputFetch(req, `${apiPath}?${query}${page}`);
    // eslint-disable-next-line no-await-in-loop
    const body = await resp.json() as Paginated<T>;

    pages = body._metadata.pages;
    result.push(body[listKey] as T[]);
  }

  return result.flat();
}
