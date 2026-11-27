import NotFoundError from '../../../common/errors/base/NotFoundError';
import CollectionDTO from '../../../lib/client/dto/collection/CollectionDTO';
import CollectionListDTO from '../../../lib/client/dto/collection/CollectionListDTO';
import CreateCollectionDTO from '../../../lib/client/dto/collection/CreateCollectionDTO';
import UpdateCollectionDTO from '../../../lib/client/dto/collection/UpdateCollectionDTO';
import PaginatedQuery, { PaginatedQueryOpts } from '../../database/PaginatedQuery';
import Service from '../Service';
import CollectionModel from './CollectionModel';
import CollectionRepository from './CollectionRepository';

export default class CollectionService extends Service {
  private collectionRepo: CollectionRepository;

  constructor(collectionRepo: CollectionRepository) {
    super();
    this.collectionRepo = collectionRepo;
  }

  async getAllCollections(
    websiteId: string,
    opts?: PaginatedQueryOpts
  ) {
    const query = await this.collectionRepo.getAllCollections(websiteId, opts);
    return this.adaptCollections(opts?.page || 1, query);
  }

  async getCollection(collectionId: string) {
    const collection = await this.collectionRepo.getCollection(collectionId);
    if (!collection) return null;
    return this.adaptCollection(collection);
  }

  private adaptCollection(collection: CollectionModel) {
    return new CollectionDTO(
      collection.getId(),
      collection.getWebsiteId(),
      collection.getName(),
      collection.shouldCallHook(),
      collection.getTitle(),
      collection.getSlug(),
      collection.isBackdatingEnabled()
    );
  }

  private async adaptCollections(page: number, paginatedClient: PaginatedQuery<CollectionModel>) {
    const { pages } = await paginatedClient.metadata();
    const collections = await paginatedClient.getPage(page);

    return new CollectionListDTO(
      page,
      pages,
      collections.map((collection) => this.adaptCollection(collection))
    );
  }

  async create(websiteId: string, create: CreateCollectionDTO) {
    const dto = new CollectionDTO(
      CollectionModel.generateId(),
      websiteId,
      create.name,
      create.callHook,
      null,
      null,
      false
    );

    await this.callHook('beforeCollectionCreateHook', { collection: dto });
    await this.collectionRepo.create(this.toModel(dto));
    await this.callHook('afterCollectionCreateHook', { collection: dto });
    return dto.id;
  }

  async update(id: string, update: UpdateCollectionDTO) {
    const collection = await this.collectionRepo.getCollection(id);
    if (!collection) throw new NotFoundError('Collection not found');
    const dto = new CollectionDTO(
      collection.getId(),
      collection.getWebsiteId(),
      update.name,
      update.callHook,
      update.title,
      update.slug,
      update.backdatingEnabled
    );

    await this.callHook('beforeCollectionModifyHook', { collection: dto });
    await this.collectionRepo.update(this.toModel(dto));
    await this.callHook('afterCollectionModifyHook', { collection: dto });
  }

  private toModel(dto: CollectionDTO) {
    return new CollectionModel(
      dto.id,
      dto.websiteId,
      dto.name,
      dto.callHook,
      dto.title,
      dto.slug,
      dto.backdatingEnabled
    );
  }

  async delete(id: string) {
    const collection = await this.collectionRepo.getCollection(id);
    if (!collection) throw new NotFoundError('Collection not found');

    const dto = this.adaptCollection(collection);
    await this.callHook('beforeCollectionDeleteHook', { collection: dto });
    await this.collectionRepo.delete(id);
    await this.callHook('afterCollectionDeleteHook', { collection: dto });
  }
}
