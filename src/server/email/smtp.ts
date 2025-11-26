import nodemailer from 'nodemailer';
import { getConfig } from '../config/config';
import { Required } from 'utility-types';

let transport: nodemailer.Transporter = null;

export async function initSmtp() {
  const { smtp } = getConfig();
  if (!smtp) return;

  try {
    const tmpTransport = nodemailer.createTransport(smtp.server);
    await tmpTransport.verify();

    transport = tmpTransport;
  } catch(err) {
    console.error('Failed to connect to SMTP server. SMTP features have been disabled', err);
  }
}

export function isEnabled() {
  return transport != null;
}

type BaseEmailOpts = Required<Omit<nodemailer.SendMailOptions, 'from'>, 'to' | 'subject'>
type EmailWithContentOpts = Required<BaseEmailOpts, 'text'> | Required<BaseEmailOpts, 'html'>

export async function send(opts: EmailWithContentOpts) {
  if (!transport) return;
  if (!opts.to) throw new Error('Email must have a destination');
  if (!opts.subject) throw new Error('Email must have subject');
  if (!opts.text && !opts.html) throw new Error('Email must have content');

  const { smtp } = getConfig();

  const info = await transport.sendMail({
    from: smtp.from,
    ...opts
  });

  console.log(`Sent email with subject "${opts.subject}" to ${opts.to}`, info.response, info.messageId);
}
