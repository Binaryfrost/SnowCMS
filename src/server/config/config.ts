import { type NormalizedConfig } from '../../config';

let cmsConfig: NormalizedConfig;

export function initConfig(config: NormalizedConfig) {
  cmsConfig = config;
}

export function getConfig(): NormalizedConfig {
  return cmsConfig;
}
