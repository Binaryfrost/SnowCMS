import BadRequestError from '../../../../../common/errors/base/BadRequestError';
import NotFoundError from '../../../../../common/errors/base/NotFoundError';
import CollectionEntryDraftDTO from '../../../../../lib/client/dto/collection/entry/draft/CollectionEntryDraftDTO';
import CollectionEntryDraftListDTO from '../../../../../lib/client/dto/collection/entry/draft/CollectionEntryDraftListDTO';
import CollectionEntryDraftSummaryDTO from '../../../../../lib/client/dto/collection/entry/draft/CollectionEntryDraftSummaryDTO';
import CollectionEntryDraftWithDataDTO from '../../../../../lib/client/dto/collection/entry/draft/CollectionEntryDraftWithDataDTO';
import CreateUpdateCollectionEntryDraftDTO from '../../../../../lib/client/dto/collection/entry/draft/CreateUpdateCollectionEntryDraftDTO';
import CollectionEntryInputDTO from '../../../../../lib/client/dto/collection/entry/CollectionEntryInputDTO';
import TimeService from '../../../common/TimeService';
import Service from '../../../Service';
import CollectionService from '../../CollectionService';
import CollectionInputService from '../../input/CollectionInputService';
import CollectionEntryDraftModel from './CollectionEntryDraftModel';
import CollectionEntryDraftRepository from './CollectionEntryDraftRepository';

export default class CollectionEntryDraftService extends Service {
  private draftRepo: CollectionEntryDraftRepository;
  private collectionService: CollectionService;
  private collectionInputService: CollectionInputService;
  private time: TimeService;

  constructor(
    draftRepo: CollectionEntryDraftRepository,
    collectionService: CollectionService,
    collectionInputService: CollectionInputService,
    time: TimeService
  ) {
    super();
    this.draftRepo = draftRepo;
    this.collectionService = collectionService;
    this.collectionInputService = collectionInputService;
    this.time = time;
  }

  async getAllDrafts(
    collectionId: string,
    search?: string,
    entryId?: string,
    opts?: { limit?: number, page?: number, sort?: 'asc' | 'desc' }
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const titleFieldName = await this.getTitleFieldName(collectionId);
    const query = await this.draftRepo.getAllDrafts(
      collectionId, search, titleFieldName, entryId, opts
    );
    const { pages } = await query.metadata();
    const drafts = await query.getPage(opts?.page || 1);

    return new CollectionEntryDraftListDTO(
      opts?.page || 1,
      pages,
      drafts.map((draft) => new CollectionEntryDraftSummaryDTO(
        draft.getId(),
        draft.getEntryId(),
        draft.getCollectionId(),
        draft.getCreatedAt(),
        draft.getUpdatedAt(),
        draft.getTitle()
      ))
    );
  }

  async getDraft(id: string, collectionId: string) {
    const draft = await this.draftRepo.getDraft(id);
    if (!draft) {
      throw new NotFoundError('Draft not found');
    }

    const inputs = await this.collectionInputService.getAllCollectionInputs(collectionId);
    const data = inputs.inputs.map((input) => new CollectionEntryInputDTO(
      null,
      input.id,
      draft.getData()[input.fieldName] || null
    ));

    return new CollectionEntryDraftWithDataDTO(
      draft.getId(),
      draft.getEntryId(),
      draft.getCollectionId(),
      draft.getCreatedAt(),
      draft.getUpdatedAt(),
      data
    );
  }

  private async getTitleFieldName(collectionId: string) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection?.title) return undefined;

    const inputs = await this.collectionInputService.getAllCollectionInputs(collectionId);
    return inputs.inputs.find((input) => input.id === collection.title)?.fieldName;
  }

  private async validateDataKeys(collectionId: string, data: Record<string, string>) {
    const inputs = await this.collectionInputService.getAllCollectionInputs(collectionId);
    const fieldNames = inputs.inputs.map((input) => input.fieldName);

    if (!Object.keys(data).every((d) => fieldNames.includes(d))) {
      throw new BadRequestError(
        'One or more properties do not reference a Collection Input\'s field name'
      );
    }
  }

  async create(
    collectionId: string,
    data: CreateUpdateCollectionEntryDraftDTO,
    existingEntryId?: string
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    await this.validateDataKeys(collectionId, data.data);

    if (existingEntryId) {
      const entryExists = await this.draftRepo.entryExists(existingEntryId);
      if (!entryExists) {
        throw new NotFoundError('Collection Entry with that ID not found');
      }
    }

    const timestamp = this.time.timestampSec();
    const draft = new CollectionEntryDraftModel(
      CollectionEntryDraftModel.generateId(),
      existingEntryId || null,
      collectionId,
      timestamp,
      timestamp,
      data.data
    );

    const dto = this.adaptToDTO(draft);
    await this.callHook('beforeCollectionEntryDraftCreateHook', { collectionEntryDraft: dto });
    await this.draftRepo.create(draft);
    await this.callHook('afterCollectionEntryDraftCreateHook', { collectionEntryDraft: dto });

    return draft.getId();
  }

  async update(
    draftId: string,
    collectionId: string,
    data: CreateUpdateCollectionEntryDraftDTO
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    await this.validateDataKeys(collectionId, data.data);

    const existing = await this.draftRepo.getDraft(draftId);
    if (!existing) {
      throw new NotFoundError('Collection Entry Draft not found');
    }

    existing.setData(data.data);
    existing.setUpdatedAt(this.time.timestampSec());

    const dto = this.adaptToDTO(existing);
    await this.callHook('beforeCollectionEntryDraftModifyHook', { collectionEntryDraft: dto });
    await this.draftRepo.update(existing);
    await this.callHook('afterCollectionEntryDraftModifyHook', { collectionEntryDraft: dto });
  }

  async delete(draftId: string) {
    const draft = await this.draftRepo.getDraft(draftId);
    if (!draft) {
      throw new NotFoundError('Draft not found');
    }

    const dto = this.adaptToDTO(draft);
    await this.callHook('beforeCollectionEntryDraftDeleteHook', { collectionEntryDraft: dto });
    await this.draftRepo.delete(draftId);
    await this.callHook('afterCollectionEntryDraftDeleteHook', { collectionEntryDraft: dto });
  }

  private adaptToDTO(draft: CollectionEntryDraftModel) {
    return new CollectionEntryDraftDTO(
      draft.getId(),
      draft.getEntryId(),
      draft.getCollectionId(),
      draft.getCreatedAt(),
      draft.getUpdatedAt(),
      draft.getData()
    );
  }
}
