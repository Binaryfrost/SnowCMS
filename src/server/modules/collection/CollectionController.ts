import type { Request, Response } from 'express';
import NotFoundError from '../../../common/errors/base/NotFoundError';
import CreateCollectionDTO from '../../../lib/client/dto/collection/CreateCollectionDTO';
import UpdateCollectionDTO from '../../../lib/client/dto/collection/UpdateCollectionDTO';
import { SuccessDTOBuilder } from '../../../lib/client/dto/SuccessDTO';
import Controller from '../Controller';
import CollectionService from './CollectionService';

export default class CollectionController extends Controller {
  private collectionService: CollectionService;

  constructor(collectionService: CollectionService) {
    super();
    this.collectionService = collectionService;
  }

  async getAll(req: Request, res: Response) {
    const dto = await this.collectionService.getAllCollections(
      req.params.websiteId,
      this.getPaginationOpts(req)
    );
    res.json(dto.toJSON());
  }

  async create(req: Request, res: Response) {
    const collection = CreateCollectionDTO.fromJSON(req.body);
    const id = await this.collectionService.create(req.params.websiteId, collection);

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection created')
      .withId(id)
      .build()
      .toJSON());
  }

  async get(req: Request, res: Response) {
    const collection = await this.collectionService.getCollection(req.params.id);
    if (!collection) throw new NotFoundError('Collection not found');

    res.json(collection.toJSON());
  }

  async update(req: Request, res: Response) {
    const collection = UpdateCollectionDTO.fromJSON(req.body);
    await this.collectionService.update(req.params.id, collection);

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection edited')
      .build()
      .toJSON());
  }

  async delete(req: Request, res: Response) {
    await this.collectionService.delete(req.params.id);

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection deleted')
      .build()
      .toJSON());
  }
}
