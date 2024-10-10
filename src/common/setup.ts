import type { ClientConfig } from '../client/client-config';
import type { NormalizedConfig } from '../config';
import { registerBuiltInInputs } from './inputs';
import { loadPlugins } from './plugins';

export default function setup(config: NormalizedConfig | ClientConfig) {
  registerBuiltInInputs();
  loadPlugins(config);
}
