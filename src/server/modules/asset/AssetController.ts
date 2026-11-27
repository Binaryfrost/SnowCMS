import type { Request, Response } from 'express';
import Controller from '../Controller';
import AssetService from '../asset/AssetService';

export default class AssetController extends Controller {
  private assetService: AssetService;

  constructor(assetService: AssetService) {
    super();
    this.assetService = assetService;
  }

  async getEmailLogo(req: Request, res: Response) {
    const url = await this.assetService.getEmailLogoUrl();
    res.redirect(302, url);
  }
}
