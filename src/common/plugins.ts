import type { PluginConfig } from '../config';
import type { Input } from './InputRegistry';
import type { Collection } from './types/Collection';
import type { CollectionEntryWithData } from './types/CollectionEntry';
import type { CollectionInput } from './types/CollectionInputs';
import type { MediaWithUrls } from './types/Media';
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
  BeforeAfterHook<'CollectionEntry', { collectionEntry: CollectionEntryWithData }> &
  BeforeAfterHook<'Media', { media: MediaWithUrls }>;

// TODO: Move doc comments to docs site
interface Hooks extends AllBeforeAfterHooks {
  /** Called server-side */
  serverStart?: (hook: ServerStartHook) => void
  /** Called client-side on page load and server-side on startup */
  setup?: (hook: SetupHook) => void
  /** Called server-side before a POST request is sent to the website hook */
  beforeWebsiteHookCalled?: (hook: BeforeWebsiteHookCalledHook) => void
}

type HookRegistryFunction<T> = (props: Omit<T, 'logger'>) => void

const HookRegistry = new Map<keyof Hooks,
  HookRegistryFunction<Parameters<Hooks[keyof Hooks]>[0]>[]>();

export function callHook<T extends keyof Hooks>(name: T, data:
  Omit<Parameters<Hooks[T]>[0], 'logger'>) {
  if (!HookRegistry.has(name)) return;
  HookRegistry.get(name).forEach((hook) => hook(data));
}

export interface Plugin {
  name: string
  // TODO: Add hook types
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

      // @ts-expect-error
      HookRegistry.get(hookName).push((props) => hook({
        ...props,
        logger
      }));
    });

    console.log(`Loaded plugin ${plugin.name}`);
  });
}
