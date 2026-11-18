import UserDTO from '../../../lib/client/dto/user/UserDTO';
import { secureRandom } from '../../util';
import Service from '../Service';
import RedisCacheService from '../common/RedisCacheService';
import UserCacheService from '../user/UserCacheService';
import UserService from '../user/UserService';

export interface SessionData {
  user: string
  sso: boolean
}

export default class SessionService extends Service {
  private userService: UserService;
  private userCacheService: UserCacheService;
  private redisService: RedisCacheService;

  constructor(
    userService: UserService, userCacheService: UserCacheService, redisService: RedisCacheService
  ) {
    super();
    this.userService = userService;
    this.userCacheService = userCacheService;
    this.redisService = redisService;
  }

  async getSession(token: string): Promise<SessionData | null> {
    const data = await this.redisService.getCache(this.getRedisKey(token));
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async getSessionUser(token: string): Promise<UserDTO | null> {
    const session = await this.getSession(token);
    if (!session) return null;
    const cachedUser = await this.userCacheService.getCachedUser(session.user);
    if (cachedUser) return cachedUser;
    return this.userService.getUser(session.user);
  }

  async createSession(userId: string, sso: boolean = false) {
    const token = this.generateToken(userId, secureRandom(32, 'base64url'));
    const session: SessionData = {
      user: userId,
      sso
    };
    await this.redisService.setCache(this.getRedisKey(token), JSON.stringify(session), 86400);
    return token;
  }

  async deleteSession(token: string) {
    await this.redisService.clearCache(this.getRedisKey(token));
  }

  async deleteAllSessionsFor(
    userId: string,
    filter?: (key: string) => boolean
  ) {
    const key = `${this.getRedisKey(userId)}:`;
    await this.redisService.clearAllCacheWithPrefix(key, filter);
  }

  private getRedisKey(token: string): string {
    return `session:${token}`;
  }

  private generateToken(id: string, random: string) {
    return `${id}:${random}`;
  }
}
