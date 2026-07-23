import SMTPConnection from 'nodemailer/lib/smtp-connection';
import ConfigProvider from './ConfigProvider';
import { SmtpConfig } from '../../../config';

export default class SmtpConfigProvider extends ConfigProvider {
  private from: string;
  private server: SMTPConnection.Options;

  constructor(config: SmtpConfig) {
    super('smtp');

    this.from = this.validator(config.from, 'from').required().string().getValue();
    this.server = this.validator(config.server, 'server').required().object().getValue();
  }

  getFrom() {
    return this.from;
  }

  getServer() {
    return this.server;
  }
}
