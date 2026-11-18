import type { Request, Response } from 'express';
import { CollectionRequestContext } from '../../../../common/RequestContext';
import BadRequestError from '../../../../common/errors/base/BadRequestError';
import CreateUpdateCollectionInputDTO from '../../../../lib/client/dto/collection/input/CreateUpdateCollectionInputDTO';
import { SuccessDTOBuilder } from '../../../../lib/client/dto/SuccessDTO';
import Controller from '../../Controller';
import CollectionInputService from './CollectionInputService';

export default class CollectionInputController extends Controller {
  private collectionInputService: CollectionInputService;

  constructor(collectionInputService: CollectionInputService) {
    super();
    this.collectionInputService = collectionInputService;
  }

  async getAll(req: Request, res: Response) {
    const dto = await this.collectionInputService.getAllCollectionInputs(req.params.collectionId);
    res.json(dto.toJSON());
  }

  async create(req: Request, res: Response) {
    const { websiteId, collectionId } = req.params;
    const input = CreateUpdateCollectionInputDTO.fromJSON(req.body);
    const context = new CollectionRequestContext(req, { websiteId, collectionId });

    const id = await this.collectionInputService.create(collectionId, input, websiteId, context);

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection Input created')
      .withId(id)
      .build()
      .toJSON());
  }

  async update(req: Request, res: Response) {
    const { websiteId, collectionId, id } = req.params;
    const input = CreateUpdateCollectionInputDTO.fromJSON(req.body);
    const context = new CollectionRequestContext(req, { websiteId, collectionId });

    await this.collectionInputService.update(id, collectionId, input, websiteId, context);

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection Input edited')
      .build()
      .toJSON());
  }

  async reorder(req: Request, res: Response) {
    const { collectionId, id } = req.params;
    const { order } = req.body;

    if (Number.isNaN(parseInt(order, 10))) {
      throw new BadRequestError('Order is required and must be a number');
    }

    await this.collectionInputService.reorder(id, collectionId, order);

    res.json(new SuccessDTOBuilder()
      .withMessage(`Moved input to position ${order}`)
      .build()
      .toJSON());
  }

  async delete(req: Request, res: Response) {
    const { websiteId, collectionId, id } = req.params;
    await this.collectionInputService.delete(id, collectionId, websiteId);

    res.json(new SuccessDTOBuilder()
      .withMessage('Collection Input deleted')
      .build()
      .toJSON());
  }
}
