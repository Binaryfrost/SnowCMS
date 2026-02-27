import { type NormalizedConfig } from '../../config';

let cmsConfig: NormalizedConfig;

export function initConfig(config: NormalizedConfig) {
  cmsConfig = config;
}

export function getConfig(): NormalizedConfig {
  if (!cmsConfig) throw new Error('Config has not yet been initialized. ' +
    'You should call getConfig() in a hook or function call, not at the root of the file');
  return cmsConfig;
}
