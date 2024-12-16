import { Request } from 'express';
import type { PluginConfig } from '../config';
import ExpressError from './ExpressError';
import type { Input } from './InputRegistry';
import type { Collection } from './types/Collection';
import type { CollectionEntryWithData } from './types/CollectionEntry';
import type { CollectionInput } from './types/CollectionInputs';
import type { CollectionTitle } from './types/CollectionTitle';
import type { Media, MediaWithUrls } from './types/Media';
import type { Website } from './types/Website';

class PluginLogger {
  private readonly name: string;

  public constructor(name: string) {
    this.name = name;
  }

  public log(...msg: any[]) {
    console.log(`[${this.name}]`, ...msg);
  }

  public warn(...msg: any[]) {
    console.warn(`[${this.name}]`, ...msg);
  }

  public error(...msg: any[]) {
    console.error(`[${this.name}]`, ...msg);
  }
}

interface Hook {
  logger: PluginLogger
}

interface ServerStartHook extends Hook {
  port: number
}

interface BeforeAfterCollectionTitlesModifyHook extends Hook {
  collectionTitle: CollectionTitle
}

interface BeforeAfterMediaHook<T = Media> extends Hook {
  media: T
}

interface SetupHook extends Hook {
  addInput<T = any>(input: Input<T>): void
}

export enum WebsiteHookCallReasons {
  COLLECTION_ENTRY_CREATED,
  COLLECTION_ENTRY_MODIFIED,
  COLLECTION_ENTRY_DELETED,
  COLLETION_INPUT_MODIFIED,
  COLLECTION_INPUT_DELETED,
  COLLECTION_DELETED
}

export enum WebsiteHookCallTargets {
  COLLECTION,
  COLLECTION_ENTRY,
  COLLECTION_INPUT
}

interface BeforeWebsiteHookCalledHook extends Hook {
  reason: {
    target: {
      type: WebsiteHookCallTargets,
      id: string
    }
    reason: WebsiteHookCallReasons
  }
  website: Website
  collection: Collection
  /** Prevents the POST request from being sent */
  cancel(): void
}

type BeforeAfterHookKey<K extends string, A extends string> =
  `before${K}${A}Hook` | `after${K}${A}Hook`;

type BeforeAfterCreateHook<K extends string> = BeforeAfterHookKey<K, 'Create'>;
type BeforeAfterModifyHook<K extends string> = BeforeAfterHookKey<K, 'Modify'>;
type BeforeAfterDeleteHook<K extends string> = BeforeAfterHookKey<K, 'Delete'>;

type CombinedBeforeAfterHook<K extends string> =
  BeforeAfterCreateHook<K> | BeforeAfterModifyHook<K> | BeforeAfterDeleteHook<K>

type BeforeAfterHook<K extends string, H> = {
  [x in CombinedBeforeAfterHook<K>]?: (hook: H & Hook) => void;
}

// TODO: Implement hook calls
type AllBeforeAfterHooks =
  BeforeAfterHook<'Website', { website: Website }> &
  BeforeAfterHook<'Collection', { collection: Collection }> &
  BeforeAfterHook<'CollectionInput', { collectionInput: CollectionInput }> &
  BeforeAfterHook<'CollectionEntry', { collectionEntry: CollectionEntryWithData }>;

// TODO: Move doc comments to docs site
interface Hooks extends AllBeforeAfterHooks {
  /** Called server-side */
  serverStart?: (hook: ServerStartHook) => void
  /** Called client-side on page load and server-side on startup */
  setup?: (hook: SetupHook) => void
  beforeCollectionTitleModifyHook?: (hook: BeforeAfterCollectionTitlesModifyHook) => void
  afterCollectionTitleModifyHook?: (hook: BeforeAfterCollectionTitlesModifyHook) => void
  beforeMediaCreateHook?: (hook: BeforeAfterMediaHook<Omit<Media, 'timestamp'>>) => void
  afterMediaCreateHook?: (hook: BeforeAfterMediaHook<Omit<Media, 'timestamp'>>) => void
  afterMediaConfirmHook?: (hook: BeforeAfterMediaHook<MediaWithUrls>) => void
  beforeMediaDeleteHook?: (hook: BeforeAfterMediaHook) => void
  afterMediaDeleteHook?: (hook: BeforeAfterMediaHook) => void
  /*
   * TODO: Implement
   * Events that trigger this hook:
   * - CollectionEntryCreate
   * - CollectionEntryModify
   * - CollectionEntryDelete
   * - CollectionInputModify
   * - CollectionInputDelete
   *
   * No other events should trigger the hook as other events
   * will most probably require code changes on the website.
   */
  /** Called server-side before a POST request is sent to the website hook */
  beforeWebsiteHookCalled?: (hook: BeforeWebsiteHookCalledHook) => void
}

type HookRegistryFunction<T> = {
  logger: PluginLogger,
  hook: (props: Omit<T, 'logger'>) => void
}

const HookRegistry = new Map<keyof Hooks,
  HookRegistryFunction<Parameters<Hooks[keyof Hooks]>[0]>[]>();

const ignoreThrowFromHooks: (keyof Hooks)[] = [
  'serverStart',
  'setup',
  'beforeWebsiteHookCalled'
];

export function callHook<T extends keyof Hooks>(name: T, data:
  Omit<Parameters<Hooks[T]>[0], 'logger'>) {
  if (!HookRegistry.has(name)) return;
  HookRegistry.get(name).forEach((hook) => {
    try {
      hook.hook(data);
    } catch (e) {
      if (ignoreThrowFromHooks.includes(name) || name.startsWith('after')) {
        hook.logger.warn('Plugin attempted to throw error from hook that does not allow errors');
        return;
      }

      throw new ExpressError(e.message || e.name, e.status || 500);
    }
  });
}

export async function callHttpHook(website: Website, collection: Collection,
  reason: BeforeWebsiteHookCalledHook['reason']) {
  if (!website.hook) return;

  let cancelled = false;

  callHook('beforeWebsiteHookCalled', {
    cancel: () => cancelled = true,
    website,
    collection,
    reason
  });

  if (cancelled) return;

  console.log('call website hook', website, collection, reason);

  const resp = await fetch(website.hook, {
    method: 'POST'
  });

  if (resp.status >= 400) {
    console.log(`Failed to send POST request to website ${website.id}. ` +
      `Response status: ${resp.status}`);
  }
}

export interface Plugin {
  name: string
  hooks: Hooks
}

export function loadPlugins(config: PluginConfig) {
  config.plugins.forEach((plugin) => {
    if (!plugin.name.match(/^[0-9A-Za-z\-_]+$/)) {
      console.error(`Failed to load plugin ${plugin.name}. ` +
        'Plugin name must be alpha-numeric and may contain a hyphen or underscore.');
      return;
    }

    const logger = new PluginLogger(plugin.name);

    Object.entries(plugin.hooks).forEach(([hookName, hook]: [keyof Hooks, Hooks[keyof Hooks]]) => {
      if (!HookRegistry.has(hookName)) {
        HookRegistry.set(hookName, []);
      }

      HookRegistry.get(hookName).push({
        logger,
        // @ts-expect-error
        hook: (props) => hook({
          ...props,
          logger
        })
      });
    });

    console.log(`Loaded plugin ${plugin.name}`);
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
