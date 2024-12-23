import { createClient } from 'redis';
import { getConfig } from '../config/config';

let client: ReturnType<typeof createClient>;
export default async function initRedis() {
  const config = getConfig();

  client = await createClient(config.redis)
    .on('error', console.error)
    .connect();
}

export function redis() {
  return client;
}
