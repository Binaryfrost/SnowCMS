import Service from '../Service';

export default abstract class CacheService extends Service {
  abstract getCache(key: string): string | Promise<string | null>;

  abstract setCache(key: string, data: string, ttl?: number): void | Promise<void>;
}
