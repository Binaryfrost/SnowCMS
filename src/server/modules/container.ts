import { getConfig } from '../config/config';
import { db } from '../database/db';
import { redis } from '../database/redis';
import SecurityMiddleware from './SecurityMiddleware';
import EncryptionService from './common/EncryptionService';
import HealthcheckController from './common/HealthcheckController';
import RedisCacheService from './common/RedisCacheService';
import SecurityService from './common/SecurityService';
import TimeService from './common/TimeService';
import AppConfigProvider from './config/AppConfigProvider';
import DisabledMediaService from './media/DisabledMediaService';
import DisabledS3Service from './media/DisabledS3Service';
import MediaController from './media/MediaController';
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
import CollectionRepository from './collection/CollectionRepository';
import CollectionService from './collection/CollectionService';
import CollectionInputRepository from './collection/input/CollectionInputRepository';
import CollectionInputService from './collection/input/CollectionInputService';
import CollectionEntryRepository from './collection/entry/CollectionEntryRepository';
import CollectionEntryService from './collection/entry/CollectionEntryService';
import CollectionEntryDraftRepository from './collection/entry/draft/CollectionEntryDraftRepository';
import CollectionEntryDraftService from './collection/entry/draft/CollectionEntryDraftService';
import DatabaseTransactionService from './common/DatabaseTransactionService';
import EmailService from './email/EmailService';
import SsoService from './sso/SsoService';
import LoginService from './login/LoginService';
import PasswordResetService from './login/PasswordResetService';
import AssetService from './asset/AssetService';
import SessionCookieService from './cookie/SessionCookieService';
import CsrfCookieService from './cookie/CsrfCookieService';
import SsoCookieService from './cookie/SsoCookieService';
import WebsiteController from './website/WebsiteController';
import CollectionController from './collection/CollectionController';
import CollectionInputController from './collection/input/CollectionInputController';
import CollectionEntryController from './collection/entry/CollectionEntryController';
import CollectionEntryDraftController from './collection/entry/draft/CollectionEntryDraftController';
import UserController from './user/UserController';
import ApiKeyController from './user/api-key/ApiKeyController';
import LoginController from './login/LoginController';
import ConfigController from './config/ConfigController';
import SecurityController from './security/SecurityController';
import AssetController from './asset/AssetController';

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
  const collection = new CollectionRepository(database);
  const collectionInput = new CollectionInputRepository(database);
  const collectionEntry = new CollectionEntryRepository(database);
  const collectionEntryDraft = new CollectionEntryDraftRepository(database);

  return {
    user,
    apiKey,
    website,
    media,
    collection,
    collectionInput,
    collectionEntry,
    collectionEntryDraft
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

  const transaction = new DatabaseTransactionService(db());

  const user = new UserService(repositories.user, userCache);
  const apiKey = new ApiKeyService(repositories.apiKey);
  const collection = new CollectionService(repositories.collection);

  const mediaConfigProvider = providers.config.getMedia();
  const s3 = mediaConfigProvider ?
    new S3Service(mediaConfigProvider) :
    new DisabledS3Service();
  const media = mediaConfigProvider ?
    new MediaService(repositories.media, mediaConfigProvider, s3, encrypt, time) :
    new DisabledMediaService();

  const website = new WebsiteService(repositories.website, user, collection, media, apiKey);

  const collectionInput = new CollectionInputService(
    repositories.collection,
    collection,
    repositories.collectionInput,
    website,
    transaction
  );

  const collectionEntry = new CollectionEntryService(
    repositories.collectionEntry,
    collection,
    collectionInput,
    website,
    time
  );

  const collectionEntryDraft = new CollectionEntryDraftService(
    repositories.collectionEntryDraft,
    collection,
    collectionInput,
    time
  );

  const session = new SessionService(user, userCache, redisCache);

  const sessionCookie = new SessionCookieService(encrypt, providers.config);
  const csrfCookie = new CsrfCookieService(encrypt, providers.config);
  const ssoCookie = new SsoCookieService(encrypt, providers.config);

  const email = new EmailService(providers.config.getSmtp());
  const sso = new SsoService(providers.config.getSso(), user);

  const login = new LoginService(user, session, sso, email);
  const passwordReset = new PasswordResetService(user, redisCache, email, providers.config, sso);
  const asset = new AssetService(providers.config);
  const security = new SecurityService(providers.config.getSecurity());

  return {
    encrypt,
    time,
    redisCache,
    userCache,
    transaction,
    user,
    apiKey,
    website,
    media,
    collection,
    collectionInput,
    collectionEntry,
    collectionEntryDraft,
    session,
    sessionCookie,
    csrfCookie,
    ssoCookie,
    email,
    sso,
    login,
    passwordReset,
    asset,
    security
  };
}
type Services = ReturnType<typeof createServices>;

function createControllers(services: Services) {
  const healthcheck = new HealthcheckController();
  const website = new WebsiteController(services.website);
  const collection = new CollectionController(services.collection);
  const collectionInput = new CollectionInputController(services.collectionInput);
  const collectionEntry = new CollectionEntryController(services.collectionEntry);
  const collectionEntryDraft = new CollectionEntryDraftController(services.collectionEntryDraft);
  const media = new MediaController(services.media);
  const user = new UserController(services.user, services.session);
  const apiKey = new ApiKeyController(services.apiKey, services.user);
  const login = new LoginController(
    services.login,
    services.passwordReset,
    services.sessionCookie,
    services.ssoCookie,
    services.csrfCookie
  );
  const config = new ConfigController(services.time);
  const security = new SecurityController(services.security);
  const asset = new AssetController(services.asset);

  return {
    healthcheck,
    website,
    collection,
    collectionInput,
    collectionEntry,
    collectionEntryDraft,
    media,
    user,
    apiKey,
    login,
    config,
    security,
    asset
  };
}
type Controllers = ReturnType<typeof createControllers>;

function createMiddleware(services: Services) {
  const security = new SecurityMiddleware(
    services.user,
    services.session,
    services.apiKey,
    services.sessionCookie,
    services.csrfCookie
  );

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
