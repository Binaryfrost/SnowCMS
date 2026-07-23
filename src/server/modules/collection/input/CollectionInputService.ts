import CollectionInputDTO from '../../../../lib/client/dto/collection/input/CollectionInputDTO';
import CollectionInputListDTO from '../../../../lib/client/dto/collection/input/CollectionInputListDTO';
import DatabaseTransactionService from '../../common/DatabaseTransactionService';
import Service from '../../Service';
import CollectionRepository from '../CollectionRepository';
import CollectionInputRepository from './CollectionInputRepository';

export default class CollectionInputService extends Service {
  private collectionRepo: CollectionRepository;
  private collectionInputRepo: CollectionInputRepository;
  private transactionService: DatabaseTransactionService;

  constructor(
    // Collection Repository instead of Service to use transaction in delete()
    collectionRepo: CollectionRepository,
    collectionInputRepo: CollectionInputRepository,
    transactionService: DatabaseTransactionService
  ) {
    super();
    this.collectionRepo = collectionRepo;
    this.collectionInputRepo = collectionInputRepo;
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

  async create() {
  // TODO: Implement
  }

  async update() {
    // TODO: Implement
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
