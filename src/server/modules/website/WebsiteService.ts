import NotFoundError from '../../../common/errors/base/NotFoundError';
import CreateUpdateWebsiteDTO from '../../../lib/client/dto/website/CreateUpdateWebsiteDTO';
import UserDTO from '../../../lib/client/dto/user/UserDTO';
import WebsiteDTO from '../../../lib/client/dto/website/WebsiteDTO';
import WebsiteListDTO from '../../../lib/client/dto/website/WebsiteListDTO';
import PaginatedQuery, { PaginatedQueryOpts } from '../../database/PaginatedQuery';
import Service from '../Service';
import type { IMediaService } from '../media/MediaService';
import ApiKeyService from '../user/api-key/ApiKeyService';
import UserService from '../user/UserService';
import CollectionService from '../collection/CollectionService';
import WebsiteModel from './WebsiteModel';
import WebsiteRepository from './WebsiteRepository';

export default class WebsiteService extends Service {
  private websiteRepo: WebsiteRepository;
  private userService: UserService;
  private collectionService: CollectionService;
  private mediaService: IMediaService;
  private apiKeyService: ApiKeyService;

  constructor(
    websiteRepo: WebsiteRepository,
    userService: UserService,
    collectionService: CollectionService,
    mediaService: IMediaService,
    apiKeyService: ApiKeyService
  ) {
    super();
    this.websiteRepo = websiteRepo;
    this.userService = userService;
    this.collectionService = collectionService;
    this.mediaService = mediaService;
    this.apiKeyService = apiKeyService;
  }

  async getWebsite(id: string) {
    const website = await this.websiteRepo.getWebsite(id);
    if (!website) return null;
    return new WebsiteDTO(website.getId(), website.getName(), website.getHook());
  }

  async getAllWebsites(opts?: PaginatedQueryOpts) {
    const paginatedClient = await this.websiteRepo.getAllWebsites(opts);
    return this.adaptToDTO(opts?.page || 1, paginatedClient);
  }

  async getAllWebsitesAccessibleBy(
    user: UserDTO, opts?: PaginatedQueryOpts
  ) {
    const { websites, role } = user;

    const paginatedClient = role === 'ADMIN' ?
      await this.websiteRepo.getAllWebsites(opts) :
      await this.websiteRepo.getWebsitesWithIds(websites, opts);

    return this.adaptToDTO(opts?.page || 1, paginatedClient);
  }

  private async adaptToDTO(page: number, paginatedClient: PaginatedQuery<WebsiteModel>) {
    const { pages } = await paginatedClient.metadata();
    const websites = await paginatedClient.getPage(page);

    return new WebsiteListDTO(
      page,
      pages,
      websites.map(
        (website) => new WebsiteDTO(website.getId(), website.getName(), website.getHook())
      )
    );
  }

  async create(website: CreateUpdateWebsiteDTO) {
    const model = new WebsiteModel(
      WebsiteModel.generateId(),
      website.name,
      website.hook
    );

    const dto = new WebsiteDTO(model.getId(), model.getName(), model.getHook());
    await this.callHook('beforeWebsiteCreateHook', { website: dto });
    await this.websiteRepo.create(model);
    await this.callHook('afterWebsiteCreateHook', { website: dto });
    return model.getId();
  }

  async update(id: string, website: CreateUpdateWebsiteDTO) {
    const existing = await this.websiteRepo.getWebsite(id);
    if (!existing) {
      throw new NotFoundError('Website not found');
    }

    const model = new WebsiteModel(
      id,
      website.name,
      website.hook
    );
    const dto = new WebsiteDTO(id, model.getName(), model.getHook());
    await this.callHook('beforeWebsiteModifyHook', { website: dto });
    await this.websiteRepo.update(model);
    await this.callHook('afterWebsiteModifyHook', { website: dto });
  }

  async delete(id: string) {
    const website = await this.websiteRepo.getWebsite(id);
    if (!website) {
      throw new NotFoundError('Website not found');
    }

    const dto = new WebsiteDTO(id, website.getName(), website.getHook());
    await this.callHook('beforeWebsiteDeleteHook', { website: dto });

    const collectionIds: string[] = [];
    let page = 1;
    let pages = 1;
    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await this.collectionService.getAllCollections(id, {
        limit: 100,
        page
      });
      pages = result._metadata.pages;
      collectionIds.push(...result.collections.map((collection) => collection.id));
      page += 1;
    } while (page <= pages);

    await Promise.all(
      collectionIds.map((collectionId) => this.collectionService.delete(collectionId))
    );

    if (this.mediaService.isEnabled()) {
      await this.mediaService.deleteAllMediaForWebsite(id);
    }
    await this.userService.removeWebsiteAccess(id);
    await this.apiKeyService.removeWebsiteAccess(id);

    await this.websiteRepo.delete(id);
    await this.callHook('afterWebsiteDeleteHook', { website: dto });
  }
}
