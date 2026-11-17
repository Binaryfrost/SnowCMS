import { v7 as uuid } from 'uuid';
import ForbiddenError from '../../../../common/errors/base/ForbiddenError';
import NotFoundError from '../../../../common/errors/base/NotFoundError';
import InputRegistry from '../../../../common/InputRegistry';
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
import { CollectionRequestContext } from '../../../../common/RequestContext';

export default class CollectionInputService extends Service {
  private collectionRepo: CollectionRepository;
  private collectionService: CollectionService;
  private collectionInputRepo: CollectionInputRepository;
  private websiteService: WebsiteService;
  private transactionService: DatabaseTransactionService;

  constructor(
    // Collection Repository to use transaction in delete()
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
      inputs.map((input) => new CollectionInputDTO(
        input.getId(),
        input.getId(),
        input.getInput(),
        input.getName(),
        input.getFieldName(),
        input.getDescription(),
        input.isRequired(),
        input.getInputConfig()
      ))
    );
  }

  async getCollectionInput(id: string) {
    const input = await this.collectionInputRepo.getCollectionInput(id);
    return new CollectionInputDTO(
      input.getId(),
      input.getId(),
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
    if (!website) return null;
  
    if ('isAllowed' in registryInput && !registryInput.isAllowed!(website, collection)) {
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
    req: CollectionRequestContext
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');
  
    const merged = await this.getMergedSettingsIfInputAllowed(
      collectionInput.input,
      collectionInput.inputConfig,
      collection.websiteId,
      collection,
      req
    );

    const id = uuid();
    await this.collectionInputRepo.create(
      new CollectionInputModelWithoutOrder(
        id,
        collectionId,
        merged.input,
        merged.name,
        merged.fieldName,
        merged.description,
        merged.required,
        merged.inputConfig
      )
    );
  }

  async update(
    inputId: string,
    collectionId: string,
    collectionInput: CreateUpdateCollectionInputDTO,
    req: CollectionRequestContext
  ) {
    const collection = await this.collectionService.getCollection(collectionId);
    if (!collection) throw new NotFoundError('Collection not found');

    const merged = await this.getMergedSettingsIfInputAllowed(
      collectionInput.input,
      collectionInput.inputConfig,
      collection.websiteId,
      collection,
      req
    );

    await this.collectionInputRepo.update(
      new CollectionInputModelWithoutOrder(
        inputId,
        collectionId,
        merged.input,
        merged.name,
        merged.fieldName,
        merged.description,
        merged.required,
        merged.inputConfig
      )
    );
  }

  async delete(inputId: string, collectionId: string) {
    await this.transactionService.run(async (trx) => {
      const collectionInputRepo = this.collectionInputRepo.withTransaction(trx);
      const collectionRepo = this.collectionRepo.withTransaction(trx);
      await collectionRepo.removeInputReferences(inputId);
      // TODO: Delete Collection Entry Inputs
      await collectionInputRepo.delete(inputId, collectionId);
    });
  }
}
