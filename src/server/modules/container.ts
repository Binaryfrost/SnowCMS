import { getConfig } from '../config/config';
import { db } from '../database/db';
import { redis } from '../database/redis';
import SecurityMiddleware from './SecurityMiddleware';
import EncryptionService from './common/EncryptionService';
import HealthcheckController from './common/HealthcheckController';
import RedisCacheService from './common/RedisCacheService';
import TimeService from './common/TimeService';
import AppConfigProvider from './config/AppConfigProvider';
import DisabledMediaService from './media/DisabledMediaService';
import DisabledS3Service from './media/DisabledS3Service';
import MediaRepository from './media/MediaRepository';
import MediaService from './media/MediaService';
import S3Service from './media/S3Service';
import SessionService from './session/SessionService';
import UserCacheService from './user/UserCacheService';
import UserRepository from './user/UserRepository';
import UserService from './user/UserService';
import ApiKeyRepository from './user/api-key/ApiKeyRepository';
import ApiKeyService from './user/api-key/ApiKeyService';
import WebsiteRepository from './website/WebsiteRepository';
import WebsiteService from './website/WebsiteService';

function createProviders() {
  const _config = getConfig();

  const config = new AppConfigProvider(_config);

  return {
    config
  };
}
type Providers = ReturnType<typeof createProviders>;

function createRepositories() {
  const database = db();

  const user = new UserRepository(database);
  const apiKey = new ApiKeyRepository(database);
  const website = new WebsiteRepository(database);
  const media = new MediaRepository(database);

  return {
    user,
    apiKey,
    website,
    media
  };
}
type Repositories = ReturnType<typeof createRepositories>;

function createServices(repositories: Repositories, providers: Providers) {
  const cache = redis();

  /*
   * IMPORTANT: If a service requires a sub-provider that is null (e.g. MediaConfigProvider),
   * the service must be a no-op unless special handling exists to account for the null provider.
   *
   * If no special handling exists, the service must implement and expose an interface that the
   * no-op service also implements and that consuming services can use as a type.
   */

  const encrypt = new EncryptionService(providers.config);
  const time = new TimeService();

  const redisCache = new RedisCacheService(cache);
  const userCache = new UserCacheService(redisCache);

  const user = new UserService(repositories.user, userCache);
  const website = new WebsiteService(repositories.website, user);
  const apiKey = new ApiKeyService(repositories.apiKey);
  const mediaConfigProvider = providers.config.getMedia();
  const s3 = mediaConfigProvider ?
    new S3Service(mediaConfigProvider) :
    new DisabledS3Service();
  const media = mediaConfigProvider ?
    new MediaService(repositories.media, mediaConfigProvider, s3, encrypt, time) :
    new DisabledMediaService();

  const session = new SessionService(user, userCache, redisCache);

  return {
    encrypt,
    time,
    redisCache,
    userCache,
    user,
    website,
    apiKey,
    s3,
    media,
    session,
  };
}
type Services = ReturnType<typeof createServices>;

function createControllers(services: Services) {
  const healthcheck = new HealthcheckController();

  return {
    healthcheck
  };
}
type Controllers = ReturnType<typeof createControllers>;

function createMiddleware(services: Services) {
  const security = new SecurityMiddleware(services.user, services.session);

  return {
    security
  };
}
type Middleware = ReturnType<typeof createMiddleware>;

interface Container {
  providers: Providers
  repositories: Repositories
  services: Services
  controllers: Controllers
  middleware: Middleware
}

let container: Container;
export function getContainer() {
  if (!container) {
    const providers = createProviders();
    const repositories = createRepositories();
    const services = createServices(repositories, providers);
    const controllers = createControllers(services);
    const middleware = createMiddleware(services);

    container = {
      providers,
      repositories,
      services,
      controllers,
      middleware
    };
  }

  return container;
}
