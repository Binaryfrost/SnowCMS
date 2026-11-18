import type { RedisClientType } from '../../database/redis';
import CacheService from './CacheService';

export default class RedisCacheService extends CacheService {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    super();
    this.redis = redis;
  }

  async getCache(key: string) {
    return this.redis.get(key);
  }

  async setCache(key: string, data: string, ttl?: number) {
    await this.redis.set(key, data, {
      EX: ttl
    });
  }

  async exists(key: string) {
    const result = await this.redis.exists(key);
    return result > 0;
  }

  async expire(key: string, ttl: number) {
    await this.redis.expire(key, ttl, 'GT');
  }

  async clearCache(key: string) {
    await this.redis.del(key);
  }

  async clearAllCacheWithPrefix(
    prefix: string,
    filter?: (key: string) => boolean
  ) {
    const batch: string[] = [];
    const BATCH_SIZE = 250;

    for await (const key of this.redis.scanIterator({
      MATCH: `${prefix}*`,
      COUNT: BATCH_SIZE
    })) {
      if (filter && !filter(key)) {
        continue;
      }

      batch.push(key);
      if (batch.length >= BATCH_SIZE) {
        await this.redis.del(batch);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await this.redis.del(batch);
    }
  }
}
