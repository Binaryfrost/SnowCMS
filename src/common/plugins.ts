import type { IRoute } from 'express';
import type { NormalizedConfig } from '../config';
import { type Input } from './InputRegistry';
import { Role } from './User';
import type { ClientConfig } from '../client/client-config';

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

interface StartHook extends Hook {
  addInput<T>(input: Input<T>): void
  /*
   * Register Express routes at /c/{plugin_name}/{path}
   * Minimum role, leave blank to allow unauthenticated access (restricted using app.use() on route)
   *
   * Returns Express route (https://expressjs.com/en/4x/api.html#app.route)
   */
  registerRoute(path: string, role?: Role): IRoute
}

interface Hooks {
  start?: (hook: StartHook) => void
  test?: (hook: {a: string}) => void
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

export function loadPlugins(config: NormalizedConfig | ClientConfig) {
  config.plugins.forEach((plugin) => {
    const logger = new PluginLogger(plugin.name);

    Object.entries(plugin.hooks).forEach(([hookName, hook]: [keyof Hooks, Hooks[keyof Hooks]]) => {
      if (!HookRegistry.has(hookName)) {
        HookRegistry.set(hookName, []);
      }

      // @ts-ignore
      HookRegistry.get(hookName).push((props) => hook({
        ...props,
        logger
      }));
    });
  });
}
