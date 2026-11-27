import { ROLE_HIERARCHY } from '../../../common/users';
import { SsoConfig } from '../../../config';
import { Role } from '../user/UserRepository';
import ConfigProvider from './ConfigProvider';

export default class SsoConfigProvider extends ConfigProvider {
  private clientId: string;
  private clientSecret: string;
  private issuer: string;
  private callbackUrl: string;
  private forceSso: boolean;
  private defaultRole: Role;
  private buttonText: string;

  constructor(config: SsoConfig) {
    super('sso');

    this.clientId = this.validator(config.clientId, 'clientId').required().string().getValue();
    this.clientSecret = this.validator(config.clientSecret, 'clientSecret').required()
      .string().getValue();
    this.issuer = this.validator(config.issuer, 'issuer').required().string().getValue();
    this.callbackUrl = this.validator(config.callbackUrl, 'callbackUrl').required()
      .string().getValue();
    this.forceSso = this.validator(config.forceSso, 'forceSso').boolean().getValue() || false;
    this.defaultRole = this.validator(config.defaultRole, 'defaultRole')
      // TODO: Test and figure out better way to get enum here
      .enum(ROLE_HIERARCHY, 'ROLE').getValue() || 'USER';
    this.buttonText = this.validator(config.buttonText, 'buttonText').string().getValue();
  }

  getClientId() {
    return this.clientId;
  }

  getClientSecret() {
    return this.clientSecret;
  }

  getIssuer() {
    return this.issuer;
  }

  getCallbackUrl() {
    return this.callbackUrl;
  }

  isSsoForced() {
    return this.forceSso;
  }

  getDefaultRole() {
    return this.defaultRole;
  }

  getButtonText() {
    return this.buttonText;
  }
}
