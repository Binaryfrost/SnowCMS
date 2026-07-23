import { RedisClientOptions } from 'redis';
import { Config } from '../../../config';
import ConfigProvider from './ConfigProvider';
import DatabaseConfigProvider from './DatabaseConfigProvider';
import MediaConfigProvider from './MediaConfigProvider';
import SsoConfigProvider from './SsoConfigProvider';
import SmtpConfigProvider from './SmtpConfigProvider';
import SecurityConfigProvider from './SecurityConfigProvider';

export default class AppConfigProvider extends ConfigProvider {
  private port: number;
  private secret: string;
  private trustProxy: any;
  private instanceUrl: string;
  private sso: SsoConfigProvider | null;
  private media: MediaConfigProvider | null;
  // TODO: Potentially remove database and redis from config provider
  private database: DatabaseConfigProvider;
  private redis: RedisClientOptions;
  private smtp: SmtpConfigProvider | null;
  private security: SecurityConfigProvider | null;
  // Build constants
  private IS_PRODUCTION = __SNOWCMS_IS_PRODUCTION__;
  private CLIENT_PUBLIC_PATH = __SNOWCMS_CLIENT_PUBLIC_PATH__;

  constructor(config: Config) {
    super();

    this.port = this.validator(config.port, 'port').integer().getValue() || 3080;
    this.secret = this.validator(config.secret, 'secret').required().string().getValue();
    this.trustProxy = config.trustProxy;
    this.instanceUrl = this.validator(config.instanceRootUrl, 'instanceRootUrl').required()
      .string().getValue();

    this.sso = config.sso ? new SsoConfigProvider(config.sso) : null;
    this.media = config.media ? new MediaConfigProvider(config.media) : null;
    this.database = new DatabaseConfigProvider(config.database);
    this.redis = config.redis;
    this.smtp = config.smtp ? new SmtpConfigProvider(config.smtp) : null;
    this.security = config.security ? new SecurityConfigProvider(config.security) : null;
  }

  getPort() {
    return this.port;
  }

  getSecret() {
    return this.secret;
  }

  getInstanceUrl() {
    return this.instanceUrl;
  }

  getTrustProxy() {
    return this.trustProxy;
  }

  getSso() {
    return this.sso;
  }

  getMedia() {
    return this.media;
  }

  getDatabase() {
    return this.database;
  }

  getRedis() {
    return this.redis;
  }

  getSmtp() {
    return this.smtp;
  }

  getSecurity() {
    return this.security;
  }

  isProduction() {
    return this.IS_PRODUCTION;
  }

  getClientPublicPath() {
    return this.CLIENT_PUBLIC_PATH;
  }
}
