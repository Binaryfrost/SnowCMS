import { v7 as uuid } from 'uuid';
import ForbiddenError from '../../../../common/errors/base/ForbiddenError';
import NotFoundError from '../../../../common/errors/base/NotFoundError';
import InputRegistry from '../../../../common/InputRegistry';
import { CollectionRequestContext } from '../../../../common/RequestContext';
import { WebsiteHookCallReasons, WebsiteHookCallTargets } from '../../../plugins/hooks';
import CollectionDTO from '../../../../lib/client/dto/collection/CollectionDTO';
import CollectionInputDTO from '../../../../lib/client/dto/collection/input/CollectionInputDTO';
import CollectionInputListDTO from '../../../../lib/client/dto/collection/input/CollectionInputListDTO';
import CreateUpdateCollectionInputDTO from '../../../../lib/client/dto/collection/input/CreateUpdateCollectionInputDTO';
import DatabaseTransactionService from '../../common/DatabaseTransactionService';
import Service from '../../Service';
import WebsiteService from '../../website/WebsiteService';
import CollectionRepository from '../CollectionRepository';
import CollectionService from '../CollectionService';
import CollectionInputRepository from './CollectionInputRepository';
import { CollectionInputModelWithoutOrder } from './CollectionInputModel';

export default class CollectionInputService extends Service {
  // Collection Repository is used to run removeInputReferences in a transaction with the
  // input deletion. This is an external repository, but is required to keep the two
  // operations atomic without introducing a circular service dependency.
  private collectionRepo: CollectionRepository;
  private collectionService: CollectionService;
  private collectionInputRepo: CollectionInputRepository;
  private websiteService: WebsiteService;
  private transactionService: DatabaseTransactionService;

  constructor(
    collectionRepo: CollectionRepository,
    collectionService: CollectionService,
    collectionInputRepo: CollectionInputRepository,
    websiteService: WebsiteService,
    transactionService: DatabaseTransactionService
  ) {
    super();
    this.collectionRepo = collectionRepo;
    this.collectionService = collectionService;
    this.collectionInputRepo = collectionInputRepo;
    this.websiteService = websiteService;
    this.transactionService = transactionService;
  }

  async getAllCollectionInputs(collectionId: string) {
    const inputs = await this.collectionInputRepo.getAllCollectionInputs(collectionId);
    return new CollectionInputListDTO(
      inputs.map((input) => this.adaptInput(input))
    );
  }

  async getCollectionInput(id: string) {
    const input = await this.collectionInputRepo.getCollectionInput(id);
    return this.adaptInput(input);
  }

  private adaptInput(input: { getId(): string, getCollectionId(): string, getInput(): string,
    getName(): string, getFieldName(): string, getDescription(): string, isRequired(): boolean,
    getInputConfig(): Record<string, any> }) {
    return new CollectionInputDTO(
      input.getId(),
      input.getCollectionId(),
      input.getInput(),
      input.getName(),
      input.getFieldName(),
      input.getDescription(),
      input.isRequired(),
      input.getInputConfig()
    );
  }

  private async getMergedSettingsIfInputAllowed(
    input: string,
    inputConfig: Record<string, any>,
    websiteId: string,
    collection: CollectionDTO,
    req: CollectionRequestContext
  ) {
    const registryInput = InputRegistry.getInput(input);
    if (!registryInput) {
      throw new NotFoundError('Provided Input does not exist in Input Registry');
    }

    const website = await this.websiteService.getWebsite(websiteId);
    if (!website) {
      throw new NotFoundError('Website not found');
    }

    if ('isAllowed' in registryInput && !registryInput.isAllowed(website, collection)) {
      throw new ForbiddenError('Website or collection does not have permission to use Input');
    }

    const merged = {
      ...(registryInput.defaultSettings || {}),
      ...inputConfig
    };

    await registryInput.validateSettings?.(merged, req);

    return merged;
  }

  async create(
    collectionId: string,
    collectionInput: CreateUpdateCollectionInputDTO,
    websiteId: string,
    req: CollectionRequestContext
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const mergedConfig = await this.getMergedSettingsIfInputAllowed(
      collectionInput.input,
      collectionInput.inputConfig,
      websiteId,
      collection,
      req
    );

    const id = uuid();
    const dto = new CollectionInputDTO(
      id,
      collectionId,
      collectionInput.input,
      collectionInput.name,
      collectionInput.fieldName,
      collectionInput.description || '',
      collectionInput.required,
      mergedConfig
    );

    await this.callHook('beforeCollectionInputCreateHook', { collectionInput: dto });

    await this.collectionInputRepo.create(this.toModel(dto));

    await this.callHook('afterCollectionInputCreateHook', { collectionInput: dto });

    return dto.id;
  }

  private toModel(dto: CollectionInputDTO) {
    return new CollectionInputModelWithoutOrder(
      dto.id,
      dto.collectionId,
      dto.input,
      dto.name,
      dto.fieldName,
      dto.description,
      dto.required,
      dto.inputConfig
    );
  }

  async update(
    inputId: string,
    collectionId: string,
    collectionInput: CreateUpdateCollectionInputDTO,
    websiteId: string,
    req: CollectionRequestContext
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const mergedConfig = await this.getMergedSettingsIfInputAllowed(
      collectionInput.input,
      collectionInput.inputConfig,
      websiteId,
      collection,
      req
    );

    const dto = new CollectionInputDTO(
      inputId,
      collectionId,
      collectionInput.input,
      collectionInput.name,
      collectionInput.fieldName,
      collectionInput.description || '',
      collectionInput.required,
      mergedConfig
    );

    await this.callHook('beforeCollectionInputModifyHook', { collectionInput: dto });

    await this.collectionInputRepo.update(this.toModel(dto));

    await this.callHook('afterCollectionInputModifyHook', { collectionInput: dto });

    const website = await this.websiteService.getWebsite(websiteId);
    if (website) {
      await this.callHttpHook(website, collection, {
        reason: WebsiteHookCallReasons.COLLETION_INPUT_MODIFIED,
        target: {
          id: dto.id,
          type: WebsiteHookCallTargets.COLLECTION_INPUT
        }
      });
    }
  }

  async reorder(inputId: string, collectionId: string, newPosition: number) {
    await this.collectionInputRepo.reorder(inputId, collectionId, newPosition);
  }

  async delete(inputId: string, collectionId: string, websiteId: string) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const input = await this.collectionInputRepo.getCollectionInput(inputId);
    const dto = this.adaptInput(input);

    await this.callHook('beforeCollectionInputDeleteHook', { collectionInput: dto });

    await this.transactionService.run(async (trx) => {
      const collectionInputRepo = this.collectionInputRepo.withTransaction(trx);
      const collectionRepo = this.collectionRepo.withTransaction(trx);
      await collectionRepo.removeInputReferences(inputId);
      await collectionInputRepo.delete(inputId, collectionId);
    });

    await this.callHook('afterCollectionInputDeleteHook', { collectionInput: dto });

    const website = await this.websiteService.getWebsite(websiteId);
    if (website) {
      await this.callHttpHook(website, collection, {
        reason: WebsiteHookCallReasons.COLLECTION_INPUT_DELETED,
        target: {
          id: inputId,
          type: WebsiteHookCallTargets.COLLECTION_INPUT
        }
      });
    }
  }
}
