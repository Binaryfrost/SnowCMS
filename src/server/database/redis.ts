import { createClient } from 'redis';
import { getConfig } from '../config/config';

export type RedisClientType = ReturnType<typeof createClient>;

let client: RedisClientType;
export default async function initRedis() {
  const config = getConfig();

  client = await createClient(config.redis)
    .on('error', console.error)
    .connect();
}

export function redis() {
  return client;
}
