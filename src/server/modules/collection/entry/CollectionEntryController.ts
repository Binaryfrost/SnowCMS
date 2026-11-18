import type { Request, Response } from 'express';
import { CollectionRequestContext } from '../../../../common/RequestContext';
import CreateUpdateCollectionEntryDTO from '../../../../lib/client/dto/collection/entry/CreateUpdateCollectionEntryDTO';
import { SuccessDTOBuilder } from '../../../../lib/client/dto/SuccessDTO';
import Controller from '../../Controller';
import CollectionEntryService from './CollectionEntryService';

export default class CollectionEntryController extends Controller {
  private collectionEntryService: CollectionEntryService;

  constructor(collectionEntryService: CollectionEntryService) {
    super();
    this.collectionEntryService = collectionEntryService;
  }

  async getAll(req: Request, res: Response) {
    const { collectionId } = req.params;
    const { search } = req.query;
    const dto = await this.collectionEntryService.getAllEntries(
      collectionId,
      search as string,
      this.getPaginationOpts(req)
    );
    res.json(dto.toJSON());
  }

  async get(req: Request, res: Response) {
    const { collectionId, id } = req.params;
    const { render } = req.query;
    const context = new CollectionRequestContext(req, {
      websiteId: req.params.websiteId,
      collectionId
    });

    const dto = await this.collectionEntryService.getEntry(
      id, collectionId, context, render && render !== 'false'
    );
    res.json(dto.toJSON());
  }

  async getBySlug(req: Request, res: Response) {
    const { collectionId } = req.params;
    const slug = req.params[0];
    const { render } = req.query;
    const context = new CollectionRequestContext(req, {
      websiteId: req.params.websiteId,
      collectionId
    });

    const dto = await this.collectionEntryService.getEntryBySlug(
      collectionId, slug, context, render && render !== 'false'
    );
    res.json(dto.toJSON());
  }

  async create(req: Request, res: Response) {
    const { websiteId, collectionId } = req.params;
    const { createdAt } = req.query;
    const data = CreateUpdateCollectionEntryDTO.fromJSON(req.body);
    const context = new CollectionRequestContext(req, { websiteId, collectionId });

    const id = await this.collectionEntryService.create(
      collectionId, websiteId, data, createdAt as string, context
    );

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection Entry created')
      .withId(id)
      .build()
      .toJSON());
  }

  async update(req: Request, res: Response) {
    const { websiteId, collectionId, id } = req.params;
    const data = CreateUpdateCollectionEntryDTO.fromJSON(req.body);
    const context = new CollectionRequestContext(req, { websiteId, collectionId });

    await this.collectionEntryService.update(id, collectionId, websiteId, data, context);

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection Entry edited')
      .build()
      .toJSON());
  }

  async delete(req: Request, res: Response) {
    const { websiteId, collectionId, id } = req.params;
    await this.collectionEntryService.delete(id, collectionId, websiteId);

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection Entry deleted')
      .build()
      .toJSON());
  }
}
