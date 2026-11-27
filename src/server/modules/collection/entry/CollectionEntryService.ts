import BadRequestError from '../../../../common/errors/base/BadRequestError';
import NotFoundError from '../../../../common/errors/base/NotFoundError';
import InputRegistry from '../../../../common/InputRegistry';
import { CollectionRequestContext } from '../../../../common/RequestContext';
import { WebsiteHookCallReasons, WebsiteHookCallTargets } from '../../../plugins/hooks';
import CollectionEntryInputDTO from '../../../../lib/client/dto/collection/entry/CollectionEntryInputDTO';
import CollectionEntryListDTO from '../../../../lib/client/dto/collection/entry/CollectionEntryListDTO';
import CollectionEntryWithDataDTO from '../../../../lib/client/dto/collection/entry/CollectionEntryWithDataDTO';
import CollectionEntryWithMetadataDTO from '../../../../lib/client/dto/collection/entry/CollectionEntryWithMetadataDTO';
import CollectionEntryWithRenderedDataDTO from '../../../../lib/client/dto/collection/entry/CollectionEntryWithRenderedDataDTO';
import CreateUpdateCollectionEntryDTO from '../../../../lib/client/dto/collection/entry/CreateUpdateCollectionEntryDTO';
import CollectionInputDTO from '../../../../lib/client/dto/collection/input/CollectionInputDTO';
import TimeService from '../../common/TimeService';
import Service from '../../Service';
import WebsiteService from '../../website/WebsiteService';
import CollectionService from '../CollectionService';
import CollectionEntryModel, { CollectionEntryInputModel } from './CollectionEntryModel';
import CollectionEntryRepository from './CollectionEntryRepository';
import CollectionInputService from '../input/CollectionInputService';

interface PreparedData {
  entry: CollectionEntryModel
  inputs: CollectionEntryInputModel[]
}

export default class CollectionEntryService extends Service {
  private collectionEntryRepo: CollectionEntryRepository;
  private collectionService: CollectionService;
  private collectionInputService: CollectionInputService;
  private websiteService: WebsiteService;
  private time: TimeService;

  constructor(
    collectionEntryRepo: CollectionEntryRepository,
    collectionService: CollectionService,
    collectionInputService: CollectionInputService,
    websiteService: WebsiteService,
    time: TimeService
  ) {
    super();
    this.collectionEntryRepo = collectionEntryRepo;
    this.collectionService = collectionService;
    this.collectionInputService = collectionInputService;
    this.websiteService = websiteService;
    this.time = time;
  }

  async getAllEntries(
    collectionId: string,
    search?: string,
    opts?: { limit?: number, page?: number, sort?: 'asc' | 'desc' }
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const query = await this.collectionEntryRepo.getAllEntries(collectionId, search, opts);
    const { pages } = await query.metadata();
    const entries = await query.getPage(opts?.page || 1);

    return new CollectionEntryListDTO(
      opts?.page || 1,
      pages,
      entries.map((entry) => new CollectionEntryWithMetadataDTO(
        entry.getId(),
        entry.getCollectionId(),
        entry.getCreatedAt(),
        entry.getUpdatedAt(),
        entry.getTitle(),
        entry.getSlug()
      ))
    );
  }

  async getEntry(id: string, collectionId: string, req: CollectionRequestContext, render: boolean) {
    const entry = await this.collectionEntryRepo.getEntry(id);
    if (!entry) {
      throw new NotFoundError('Collection Entry not found');
    }

    const inputs = await this.collectionEntryRepo.getEntryInputs(id);

    if (render) {
      const renderedData = await this.renderInputs(inputs, collectionId, req);
      return new CollectionEntryWithRenderedDataDTO(
        entry.getId(),
        entry.getCollectionId(),
        entry.getCreatedAt(),
        entry.getUpdatedAt(),
        renderedData
      );
    }

    return this.adaptWithData(entry, inputs);
  }

  async getEntryBySlug(
    collectionId: string,
    slug: string,
    req: CollectionRequestContext,
    render: boolean
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    if (!collection.slug) {
      throw new BadRequestError('Accessing entries using a slug is not configured for this Collection');
    }

    const entryId = await this.collectionEntryRepo.getEntryIdBySlug(collection.slug, slug);
    if (!entryId) {
      throw new NotFoundError('Collection Entry not found');
    }

    return this.getEntry(entryId, collectionId, req, render);
  }

  private async renderInputs(
    inputs: CollectionEntryInputModel[],
    collectionId: string,
    req: CollectionRequestContext
  ) {
    const list = await this.collectionInputService.getAllCollectionInputs(collectionId);
    const keyedInputs = inputs.reduce((a, c) => ({
      ...a,
      [c.getInputId()]: c.getData()
    }), {});

    const renderedInputs: (() => Promise<{ name: string, data: any }>)[] = [];

    for (const collectionInput of list.inputs) {
      const registryInput = InputRegistry.getInput(collectionInput.input);
      if (!registryInput) continue;

      const data = keyedInputs[collectionInput.id] || null;
      const settings = {
        ...(registryInput.defaultSettings || {}),
        ...collectionInput.inputConfig
      };

      renderedInputs.push(async () => ({
        name: collectionInput.fieldName,
        data: await registryInput.renderHtml(
          !registryInput.isVisualOnly ? registryInput.deserialize(data) : null,
          settings,
          req
        )
      }));
    }

    const results = await Promise.all(renderedInputs.map((promise) => promise()));
    return results.reduce((a, c) => ({
      ...a,
      [c.name]: c.data
    }), {});
  }

  private mergeSettings(input: string, settings: Record<string, any>) {
    const registryInput = InputRegistry.getInput(input);
    if (!registryInput) return {};

    return {
      ...registryInput.defaultSettings,
      ...settings
    };
  }

  private async checkInputValueValidity(
    collectionInput: CollectionInputDTO,
    data: string,
    req: CollectionRequestContext
  ) {
    const registryInput = InputRegistry.getInput(collectionInput.input);
    if (!registryInput) return;

    if (registryInput.isVisualOnly) return;
    if (collectionInput.required && !data) {
      throw new BadRequestError(`Required input "${collectionInput.name}" does not have a value`);
    }

    await registryInput.validate?.(
      data,
      collectionInput.required,
      this.mergeSettings(collectionInput.input, collectionInput.inputConfig),
      req
    );
  }

  private async prepareData(
    data: Record<string, string>,
    collectionId: string,
    entryId: string,
    backdatedCreatedAt: string | undefined,
    req: CollectionRequestContext
  ): Promise<PreparedData> {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const list = await this.collectionInputService.getAllCollectionInputs(collectionId);
    const collectionInputs = list.inputs.reduce((a, c) => ({
      ...a,
      [c.fieldName]: c
    }), {} as Record<string, CollectionInputDTO>);

    Object.keys(data).forEach((key) => {
      if (!(key in collectionInputs)) {
        throw new BadRequestError(`Invalid data: Input ${key} does not exist on this Collection`);
      }
    });

    const updates: CollectionEntryInputModel[] = [];
    for (const key in collectionInputs) {
      if (Object.prototype.hasOwnProperty.call(collectionInputs, key)) {
        const collectionInput = collectionInputs[key];
        // eslint-disable-next-line no-await-in-loop
        await this.checkInputValueValidity(collectionInput, data[key], req);

        const registryInput = InputRegistry.getInput(collectionInput.input);
        const originalValue = data[key];
        const transformedValue = registryInput?.transform?.(
          originalValue, collectionInput.inputConfig
        ) ?? originalValue;

        if (collection.slug && collection.slug === collectionInput.id && transformedValue) {
          // eslint-disable-next-line no-await-in-loop
          const duplicate = await this.collectionEntryRepo.hasEntryWithSlug(
            collection.slug,
            transformedValue,
            entryId
          );

          if (duplicate) {
            throw new BadRequestError('An Entry with that slug already exists');
          }
        }

        updates.push(new CollectionEntryInputModel(
          entryId,
          collectionInput.id,
          transformedValue
        ));
      }
    }

    const existingEntry = await this.collectionEntryRepo.getEntry(entryId);

    if (!existingEntry && backdatedCreatedAt) {
      if (!collection.backdatingEnabled) {
        throw new BadRequestError('Backdating is not enabled for this Collection');
      }

      if (!backdatedCreatedAt.match(/^[0-9]+$/)) {
        throw new BadRequestError('Timestamp must be a number');
      }

      const backdatedTime = parseInt(backdatedCreatedAt, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      if (backdatedTime >= currentTime) {
        throw new BadRequestError('Backdated timestamp cannot be in the future');
      }
    }

    const timestamp = this.time.timestampSec();
    const entry = new CollectionEntryModel(
      entryId,
      collectionId,
      existingEntry?.getCreatedAt() ||
        (backdatedCreatedAt ? parseInt(backdatedCreatedAt, 10) : timestamp),
      timestamp
    );

    return {
      entry,
      inputs: updates
    };
  }

  private adaptWithData(entry: CollectionEntryModel, inputs: CollectionEntryInputModel[]) {
    return new CollectionEntryWithDataDTO(
      entry.getId(),
      entry.getCollectionId(),
      entry.getCreatedAt(),
      entry.getUpdatedAt(),
      inputs.map((input) => new CollectionEntryInputDTO(
        input.getEntryId(),
        input.getInputId(),
        input.getData()
      ))
    );
  }

  private toModels(dto: CollectionEntryWithDataDTO) {
    const entry = new CollectionEntryModel(
      dto.id,
      dto.collectionId,
      dto.createdAt,
      dto.updatedAt
    );
    const inputs = dto.data.map((input) => new CollectionEntryInputModel(
      input.entryId || dto.id,
      input.inputId,
      input.data
    ));

    return { entry, inputs };
  }

  async create(
    collectionId: string,
    websiteId: string,
    data: CreateUpdateCollectionEntryDTO,
    backdatedCreatedAt: string | undefined,
    req: CollectionRequestContext
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const id = CollectionEntryModel.generateId();
    const { entry, inputs } = await this.prepareData(
      data.data, collectionId, id, backdatedCreatedAt, req
    );
    const payload = this.adaptWithData(entry, inputs);

    await this.callHook('beforeCollectionEntryCreateHook', { collectionEntry: payload });

    const { entry: finalEntry, inputs: finalInputs } = this.toModels(payload);
    await this.collectionEntryRepo.create(finalEntry, finalInputs);

    await this.callHook('afterCollectionEntryCreateHook', { collectionEntry: payload });

    await this.callHttpHookForEntry(
      websiteId,
      collectionId,
      payload.id,
      WebsiteHookCallReasons.COLLECTION_ENTRY_CREATED,
      WebsiteHookCallTargets.COLLECTION_ENTRY
    );

    return payload.id;
  }

  async update(
    entryId: string,
    collectionId: string,
    websiteId: string,
    data: CreateUpdateCollectionEntryDTO,
    req: CollectionRequestContext
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const existing = await this.collectionEntryRepo.getEntry(entryId);
    if (!existing) throw new NotFoundError('Collection Entry not found');

    const { entry, inputs } = await this.prepareData(
      data.data, collectionId, entryId, undefined, req
    );
    const payload = this.adaptWithData(entry, inputs);

    await this.callHook('beforeCollectionEntryModifyHook', { collectionEntry: payload });

    const { entry: finalEntry, inputs: finalInputs } = this.toModels(payload);
    await this.collectionEntryRepo.update(finalEntry, finalInputs);

    await this.callHook('afterCollectionEntryModifyHook', { collectionEntry: payload });

    await this.callHttpHookForEntry(
      websiteId,
      collectionId,
      payload.id,
      WebsiteHookCallReasons.COLLECTION_ENTRY_MODIFIED,
      WebsiteHookCallTargets.COLLECTION_ENTRY
    );
  }

  async delete(entryId: string, collectionId: string, websiteId: string) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const existing = await this.collectionEntryRepo.getEntry(entryId);
    if (!existing) throw new NotFoundError('Collection Entry not found');

    const inputs = await this.collectionEntryRepo.getEntryInputs(entryId);
    const payload = this.adaptWithData(existing, inputs);

    await this.callHook('beforeCollectionEntryDeleteHook', { collectionEntry: payload });
    await this.collectionEntryRepo.delete(entryId);
    await this.callHook('afterCollectionEntryDeleteHook', { collectionEntry: payload });

    await this.callHttpHookForEntry(
      websiteId,
      collectionId,
      entryId,
      WebsiteHookCallReasons.COLLECTION_ENTRY_DELETED,
      WebsiteHookCallTargets.COLLECTION_ENTRY
    );
  }

  private async callHttpHookForEntry(
    websiteId: string,
    collectionId: string,
    entryId: string,
    reason: WebsiteHookCallReasons,
    targetType: WebsiteHookCallTargets
  ) {
    const website = await this.websiteService.getWebsite(websiteId);
    const collection = await this.collectionService.getCollection(collectionId);
    if (!website || !collection) return;

    await this.callHttpHook(website, collection, {
      reason,
      target: {
        id: entryId,
        type: targetType
      }
    });
  }
}
