import type { Request, Response } from 'express';
import CreateUpdateCollectionEntryDraftDTO from '../../../../../lib/client/dto/collection/entry/draft/CreateUpdateCollectionEntryDraftDTO';
import { SuccessDTOBuilder } from '../../../../../lib/client/dto/SuccessDTO';
import Controller from '../../../Controller';
import CollectionEntryDraftService from './CollectionEntryDraftService';

export default class CollectionEntryDraftController extends Controller {
  private draftService: CollectionEntryDraftService;

  constructor(draftService: CollectionEntryDraftService) {
    super();
    this.draftService = draftService;
  }

  async getAll(req: Request, res: Response) {
    const { collectionId } = req.params;
    const { search, entry } = req.query;

    const dto = await this.draftService.getAllDrafts(
      collectionId,
      search as string,
      entry as string,
      this.getPaginationOpts(req)
    );
    res.json(dto.toJSON());
  }

  async create(req: Request, res: Response) {
    const { collectionId } = req.params;
    const { entry } = req.query;
    const data = CreateUpdateCollectionEntryDraftDTO.fromJSON(req.body);

    const id = await this.draftService.create(collectionId, data, entry as string);

    res.json(new SuccessDTOBuilder()
      .withMessage('Draft created')
      .withId(id)
      .build()
      .toJSON());
  }

  async get(req: Request, res: Response) {
    const { collectionId, id } = req.params;
    const dto = await this.draftService.getDraft(id, collectionId);
    res.json(dto.toJSON());
  }

  async update(req: Request, res: Response) {
    const { collectionId, id } = req.params;
    const data = CreateUpdateCollectionEntryDraftDTO.fromJSON(req.body);
    await this.draftService.update(id, collectionId, data);

    res.json(new SuccessDTOBuilder()
      .withMessage('Draft edited')
      .withId(id)
      .build()
      .toJSON());
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await this.draftService.delete(id);

    res.json(new SuccessDTOBuilder()
      .withMessage('Draft deleted')
      .build()
      .toJSON());
  }
}
