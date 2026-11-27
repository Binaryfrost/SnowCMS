import ExpressError from '../../common/errors/base/ExpressError';
import { UNSAFE_SOURCE_HEADER } from '../../common/constants';
import { loadPlugins } from '../../common/plugins/plugins';
import { PluginConfig } from '../../config';
import WebsiteDTO from '../../lib/client/dto/website/WebsiteDTO';
import CollectionDTO from '../../lib/client/dto/collection/CollectionDTO';
import CollectionInputDTO from '../../lib/client/dto/collection/input/CollectionInputDTO';
import CollectionEntryWithDataDTO from '../../lib/client/dto/collection/entry/CollectionEntryWithDataDTO';
import CollectionEntryDraftDTO from '../../lib/client/dto/collection/entry/draft/CollectionEntryDraftDTO';
import MediaDTO from '../../lib/client/dto/media/MediaDTO';
import MediaCreateDTO from '../../lib/client/dto/media/MediaCreateDTO';
import MediaWithUrlsDTO from '../../lib/client/dto/media/MediaWithUrlsDTO';
import { isSafeUrl } from '../ssrf';

interface ServerStartHook {
  port: number
}

interface BeforeAfterMediaCreateHook {
  media: MediaCreateDTO
}

interface BeforeAfterMediaDeleteHook {
  media: MediaDTO
}

interface AfterMediaConfirmHook {
  media: MediaWithUrlsDTO
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
  website: WebsiteDTO;
  collection: CollectionDTO;
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
  [x in CombinedBeforeAfterHook<K>]?: (hook: H) => void | Promise<void>;
};

type AllBeforeAfterHooks =
  BeforeAfterHook<'Website', { website: WebsiteDTO; }> &
  BeforeAfterHook<'Collection', { collection: CollectionDTO; }> &
  BeforeAfterHook<'CollectionInput', { collectionInput: CollectionInputDTO; }> &
  BeforeAfterHook<'CollectionEntry', { collectionEntry: CollectionEntryWithDataDTO; }> &
  BeforeAfterHook<'CollectionEntryDraft', { collectionEntryDraft: CollectionEntryDraftDTO; }>;

// TODO: Move doc comments to docs site
export interface Hooks extends AllBeforeAfterHooks {
  /** Called server-side */
  serverStart?: (hook: ServerStartHook) => void | Promise<void>;
  beforeMediaCreateHook?: (hook: BeforeAfterMediaCreateHook) => void | Promise<void>;
  afterMediaCreateHook?: (hook: BeforeAfterMediaCreateHook) => void | Promise<void>;
  afterMediaConfirmHook?: (hook: AfterMediaConfirmHook) => void | Promise<void>;
  beforeMediaDeleteHook?: (hook: BeforeAfterMediaDeleteHook) => void | Promise<void>;
  afterMediaDeleteHook?: (hook: BeforeAfterMediaDeleteHook) => void | Promise<void>;
  /** Called server-side before a POST request is sent to the website hook */
  beforeWebsiteHookCalled?: (hook: BeforeWebsiteHookCalledHook) => void | Promise<void>;
}

type HookRegistryFunction<T> = (props: T) => void | Promise<void>;

export const HookRegistry = new Map<keyof Hooks,
  HookRegistryFunction<Parameters<Hooks[keyof Hooks]>[0]>[]>();
const ignoreThrowFromHooks: (keyof Hooks)[] = [
  'serverStart',
  'beforeWebsiteHookCalled'
];

export async function callHook<T extends keyof Hooks>(name: T, data: Parameters<Hooks[T]>[0]) {
  if (!HookRegistry.has(name)) return;
  const hooks = HookRegistry.get(name);
  for await (const hook of hooks) {
    try {
      await hook(data);
    } catch (e) {
      if (ignoreThrowFromHooks.includes(name) || name.startsWith('after')) {
        console.warn(`Hook ${name} attempted to throw error from hook that does not allow errors`);
        return;
      }

      throw new ExpressError(e.message || e.name, e.status || 500);
    }
  }
}

function httpHookFetchError(website: WebsiteDTO) {
  return `Failed to send POST request to website ${website.id}`;
}

export async function callHttpHook(
  website: WebsiteDTO,
  collection: CollectionDTO,
  reason: BeforeWebsiteHookCalledHook['reason']
) {
  if (!website.hook || !collection.callHook) return;

  const safeUrlResult = await isSafeUrl(website.hook);
  if (!safeUrlResult.safe) {
    // Only log the hostname as the rest of the URL could contain sensitive information
    console.log(`Webhook request to ${safeUrlResult.hostname || 'unparseable URL'} for website ${website.id} blocked by SSRF filter`);
    return;
  }

  let cancelled = false;

  await callHook('beforeWebsiteHookCalled', {
    cancel: () => cancelled = true,
    website,
    collection,
    reason
  });

  if (cancelled) return;

  try {
    const resp = await fetch(website.hook, {
      method: 'POST',
      headers: {
        [UNSAFE_SOURCE_HEADER]: 'webhook'
      }
    });

    if (resp.status >= 400) {
      console.error(`${httpHookFetchError(website)}. Response status: ${resp.status}`);
    }
  } catch (e) {
    console.error(`${httpHookFetchError(website)}. Error: ${e}`);
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
