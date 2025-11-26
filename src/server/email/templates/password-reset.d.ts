import { TemplateDataBase } from './render';

export interface PasswordResetTemplate extends TemplateDataBase {
  instance_url: string
  ip_address: string
  browser: string
  os: string
  reset_link: string
}