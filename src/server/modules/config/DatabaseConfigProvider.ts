import { DatabaseConfig } from '../../../config';
import ConfigProvider from './ConfigProvider';

export default class DatabaseConfigProvider extends ConfigProvider {
  private host: string;
  private port: number;
  private database: string;
  private username: string;
  private password: string;

  constructor(config: DatabaseConfig) {
    super('database');

    this.host = this.validator(config.host, 'host').required().string().getValue();
    this.port = this.validator(config.port, 'port').number().getValue() || 3306;
    this.database = this.validator(config.database, 'database').required().string().getValue();
    this.username = this.validator(config.username, 'username').required().string().getValue();
    this.password = this.validator(config.password, 'password').required().string().getValue();
  }

  getHost() {
    return this.host;
  }

  getPort() {
    return this.port;
  }

  getDatabase() {
    return this.database;
  }

  getUsername() {
    return this.username;
  }

  getPassword() {
    return this.password;
  }
}
