import type { IRoute } from 'express';
import type { PluginConfig } from '../config';
import { type Input } from './InputRegistry';
import { Role } from './User';

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

interface ServerSetupHook extends Hook {
  /*
   * Register Express routes
   * Minimum role, leave blank to allow unauthenticated access (restricted using app.use() on route)
   *
   * Returns Express route (https://expressjs.com/en/4x/api.html#app.route)
   */
  registerRoute(path: string, role?: Role): IRoute
}

interface ServerStartHook extends Hook {
  port: number
}

interface SetupHook extends Hook {
  addInput<T = any>(input: Input<T>): void;
}

interface Hooks {
  /** Called server-side */
  serverSetup?: (hook: ServerSetupHook) => void
  /** Called server-side */
  serverStart?: (hook: ServerStartHook) => void
  /** Called client-side on page load and server-side on startup */
  setup?: (hook: SetupHook) => void
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
