import { getManifest } from '../../manifest';
import AppConfigProvider from '../config/AppConfigProvider';
import Service from '../Service';

export default class AssetService extends Service {
  private config: AppConfigProvider;

  constructor(config: AppConfigProvider) {
    super();
    this.config = config;
  }

  async getEmailLogoUrl() {
    const manifest = await getManifest();
    const logo = manifest['logo.png'];
    const clientPublicPath = this.config.getClientPublicPath();

    return clientPublicPath ? logo : new URL(logo, this.config.getInstanceUrl()).href;
  }
}
