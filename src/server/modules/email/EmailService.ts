import nodemailer from 'nodemailer';
import { Required } from 'utility-types';
import SmtpConfigProvider from '../config/SmtpConfigProvider';
import Service from '../Service';

type BaseEmailOpts = Required<Omit<nodemailer.SendMailOptions, 'from'>, 'to' | 'subject'>
type EmailWithContentOpts = Required<BaseEmailOpts, 'text'> | Required<BaseEmailOpts, 'html'>

export default class EmailService extends Service {
  private config: SmtpConfigProvider | null;
  private transport: nodemailer.Transporter | null = null;

  constructor(config: SmtpConfigProvider | null) {
    super();
    this.config = config;
  }

  async initialize() {
    if (!this.config) return;

    try {
      const tmpTransport = nodemailer.createTransport(this.config.getServer());
      await tmpTransport.verify();
      this.transport = tmpTransport;
    } catch (err) {
      console.error('Failed to connect to SMTP server. SMTP features have been disabled', err);
    }
  }

  isEnabled() {
    return this.transport != null;
  }

  async send(opts: EmailWithContentOpts) {
    if (!this.transport || !this.config) return;
    if (!opts.to) throw new Error('Email must have a destination');
    if (!opts.subject) throw new Error('Email must have subject');
    if (!opts.text && !opts.html) throw new Error('Email must have content');

    const info = await this.transport.sendMail({
      from: this.config.getFrom(),
      ...opts
    });

    console.log(
      `Sent email with subject "${opts.subject}" to ${opts.to}`,
      info.response,
      info.messageId
    );
  }
}
