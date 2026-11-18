import type { Request, Response } from 'express';
import NotFoundError from '../../../common/errors/base/NotFoundError';
import CreateUpdateWebsiteDTO from '../../../lib/client/dto/website/CreateUpdateWebsiteDTO';
import { SuccessDTOBuilder } from '../../../lib/client/dto/SuccessDTO';
import Controller from '../Controller';
import WebsiteService from './WebsiteService';

export default class WebsiteController extends Controller {
  private websiteService: WebsiteService;

  constructor(websiteService: WebsiteService) {
    super();
    this.websiteService = websiteService;
  }

  async getAll(req: Request, res: Response) {
    const dto = await this.websiteService.getAllWebsitesAccessibleBy(
      req.user,
      this.getPaginationOpts(req)
    );
    res.json(dto.toJSON());
  }

  async create(req: Request, res: Response) {
    const website = CreateUpdateWebsiteDTO.fromJSON(req.body);
    const id = await this.websiteService.create(website);

    res.json(new SuccessDTOBuilder()
      .withMessage('Website created')
      .withId(id)
      .build()
      .toJSON());
  }

  async get(req: Request, res: Response) {
    const website = await this.websiteService.getWebsite(req.params.id);
    if (!website) throw new NotFoundError('Website not found');

    res.json(website.toJSON());
  }

  async update(req: Request, res: Response) {
    const website = CreateUpdateWebsiteDTO.fromJSON(req.body);
    await this.websiteService.update(req.params.id, website);

    res.json(new SuccessDTOBuilder()
      .withMessage('Website edited')
      .build()
      .toJSON());
  }

  async delete(req: Request, res: Response) {
    await this.websiteService.delete(req.params.id);

    res.json(new SuccessDTOBuilder()
      .withMessage('Website deleted')
      .build()
      .toJSON());
  }
}
