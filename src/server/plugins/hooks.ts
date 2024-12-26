import ExpressError from '../../common/ExpressError';
import { loadPlugins } from '../../common/plugins/plugins';
import type { Collection } from '../../common/types/Collection';
import type { CollectionEntryWithData } from '../../common/types/CollectionEntry';
import type { CollectionInput } from '../../common/types/CollectionInputs';
import type { CollectionTitle } from '../../common/types/CollectionTitle';
import type { Media, MediaWithUrls } from '../../common/types/Media';
import type { Website } from '../../common/types/Website';
import { PluginConfig } from '../../config';

interface ServerStartHook {
  port: number
}

interface BeforeAfterCollectionTitlesModifyHook {
  collectionTitle: CollectionTitle
}

interface BeforeAfterMediaHook<T = Media> {
  media: T
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

interface BeforeWebsiteHookCalledHook {
  reason: {
    target: {
      type: WebsiteHookCallTargets;
      id: string;
    };
    reason: WebsiteHookCallReasons;
  };
  website: Website;
  collection: Collection;
  /** Prevents the POST request from being sent */
  cancel(): void;
}

type BeforeAfterHookKey<K extends string, A extends string> =
  `before${K}${A}Hook` | `after${K}${A}Hook`;

type BeforeAfterCreateHook<K extends string> = BeforeAfterHookKey<K, 'Create'>;
type BeforeAfterModifyHook<K extends string> = BeforeAfterHookKey<K, 'Modify'>;
type BeforeAfterDeleteHook<K extends string> = BeforeAfterHookKey<K, 'Delete'>;

type CombinedBeforeAfterHook<K extends string> =
  BeforeAfterCreateHook<K> | BeforeAfterModifyHook<K> | BeforeAfterDeleteHook<K>;

type BeforeAfterHook<K extends string, H> = {
  [x in CombinedBeforeAfterHook<K>]?: (hook: H) => void;
};

type AllBeforeAfterHooks =
  BeforeAfterHook<'Website', { website: Website; }> &
  BeforeAfterHook<'Collection', { collection: Collection; }> &
  BeforeAfterHook<'CollectionInput', { collectionInput: CollectionInput; }> &
  BeforeAfterHook<'CollectionEntry', { collectionEntry: CollectionEntryWithData; }>;

// TODO: Move doc comments to docs site
export interface Hooks extends AllBeforeAfterHooks {
  /** Called server-side */
  serverStart?: (hook: ServerStartHook) => void;
  beforeCollectionTitleModifyHook?: (hook: BeforeAfterCollectionTitlesModifyHook) => void;
  afterCollectionTitleModifyHook?: (hook: BeforeAfterCollectionTitlesModifyHook) => void;
  beforeMediaCreateHook?: (hook: BeforeAfterMediaHook<Omit<Media, 'timestamp'>>) => void;
  afterMediaCreateHook?: (hook: BeforeAfterMediaHook<Omit<Media, 'timestamp'>>) => void;
  afterMediaConfirmHook?: (hook: BeforeAfterMediaHook<MediaWithUrls>) => void;
  beforeMediaDeleteHook?: (hook: BeforeAfterMediaHook) => void;
  afterMediaDeleteHook?: (hook: BeforeAfterMediaHook) => void;
  /** Called server-side before a POST request is sent to the website hook */
  beforeWebsiteHookCalled?: (hook: BeforeWebsiteHookCalledHook) => void;
}

type HookRegistryFunction<T> = (props: T) => void;

export const HookRegistry = new Map<keyof Hooks,
  HookRegistryFunction<Parameters<Hooks[keyof Hooks]>[0]>[]>();
const ignoreThrowFromHooks: (keyof Hooks)[] = [
  'serverStart',
  'beforeWebsiteHookCalled'
];

export function callHook<T extends keyof Hooks>(name: T, data: Parameters<Hooks[T]>[0]) {
  if (!HookRegistry.has(name)) return;
  HookRegistry.get(name).forEach((hook) => {
    try {
      hook(data);
    } catch (e) {
      if (ignoreThrowFromHooks.includes(name) || name.startsWith('after')) {
        console.warn(`Hook ${name} attempted to throw error from hook that does not allow errors`);
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

  const resp = await fetch(website.hook, {
    method: 'POST'
  });

  if (resp.status >= 400) {
    console.log(`Failed to send POST request to website ${website.id}. ` +
      `Response status: ${resp.status}`);
  }
}

export default function loadHooks(config: PluginConfig<Hooks>) {
  loadPlugins(config, 'hooks', (hooks) => {
    let hook: keyof Hooks;
    for (hook in hooks) {
      if (Object.prototype.hasOwnProperty.call(hooks, hook)) {
        const hookFn = hooks[hook];

        if (!HookRegistry.has(hook)) {
          HookRegistry.set(hook, []);
        }

        HookRegistry.get(hook).push(hookFn);
      }
    }
  });
}
