import type { Request, Response } from 'express';
import BadRequestError from '../../../common/errors/base/BadRequestError';
import SafeUrlResultDTO from '../../../lib/client/dto/security/SafeUrlResultDTO';
import Controller from '../Controller';
import SecurityService from '../common/SecurityService';

export default class SecurityController extends Controller {
  private securityService: SecurityService;

  constructor(securityService: SecurityService) {
    super();
    this.securityService = securityService;
  }

  async checkUrl(req: Request, res: Response) {
    const { url } = req.body;
    if (!url) throw new BadRequestError('URL is required');

    const result = await this.securityService.shouldBlockUrl(url);
    res.json(new SafeUrlResultDTO(result.safe, result.hostname).toJSON());
  }
}
