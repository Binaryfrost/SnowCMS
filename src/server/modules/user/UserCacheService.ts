import UserDTO from '../../../lib/client/dto/user/UserDTO';
import Service from '../Service';
import RedisCacheService from '../common/RedisCacheService';

export default class UserCacheService extends Service {
  private redisService: RedisCacheService;

  constructor(redisService: RedisCacheService) {
    super();
    this.redisService = redisService;
  }

  async getCachedUser(id: string): Promise<UserDTO | null> {
    const key = this.getCacheKey(id);
    const data = await this.redisService.getCache(key);
    if (data) return UserDTO.fromJSON(JSON.parse(data));
    return null;
  }

  async setCachedUser(user: UserDTO) {
    const key = this.getCacheKey(user.id);
    const ttl = 10 * 60;
    await this.redisService.setCache(key, JSON.stringify(user.toJSON()), ttl);
  }

  async invalidateCachedUser(id: string) {
    const key = this.getCacheKey(id);
    await this.redisService.clearCache(key);
  }

  private getCacheKey(id: string) {
    return `user:${id}`;
  }
}
