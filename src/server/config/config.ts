import { type NormalizedConfig } from '../../config';
import { init as initSsrf, addToUnsafeIpList } from '../ssrf';

let cmsConfig: NormalizedConfig;

export function initConfig(config: NormalizedConfig) {
  cmsConfig = config;

  const ssrfEnabled = config.security?.ssrf?.enabled ?? true;
  if (ssrfEnabled) {
    initSsrf();
    addToUnsafeIpList(...(config.security?.ssrf?.additional || []));
  }
}

export function getConfig(): NormalizedConfig {
  if (!cmsConfig) throw new Error('Config has not yet been initialized. ' +
    'You should call getConfig() in a hook or function call, not at the root of the file');
  return cmsConfig;
}
