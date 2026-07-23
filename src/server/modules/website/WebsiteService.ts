import NotFoundError from '../../../common/errors/base/NotFoundError';
import UserDTO from '../../../lib/client/dto/user/UserDTO';
import CreateUpdateWebsiteDTO from '../../../lib/client/dto/website/CreateUpdateWebsiteDTO';
import WebsiteDTO from '../../../lib/client/dto/website/WebsiteDTO';
import WebsiteListDTO from '../../../lib/client/dto/website/WebsiteListDTO';
import PaginatedQuery, { PaginatedQueryOpts } from '../../database/PaginatedQuery';
import Service from '../Service';
import UserService from '../user/UserService';
import WebsiteModel from './WebsiteModel';
import WebsiteRepository from './WebsiteRepository';

export default class WebsiteService extends Service {
  private websiteRepo: WebsiteRepository;
  private userService: UserService;

  constructor(websiteRepo: WebsiteRepository, userService: UserService) {
    super();
    this.websiteRepo = websiteRepo;
    this.userService = userService;
  }

  async getAllWebsites(opts?: PaginatedQueryOpts) {
    const paginatedClient = await this.websiteRepo.getAllWebsites(opts);
    return this.adaptToDTO(opts?.page || 1, paginatedClient);
  }

  async getAllWebsitesAccessibleBy(
    user: UserDTO | string, opts?: PaginatedQueryOpts
  ) {
    const resolvedUser = typeof user === 'string' ?
      await this.userService.getUser(user) : user;
    if (!resolvedUser) {
      throw new NotFoundError('User not found');
    }
    const { websites, role } = resolvedUser;

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
    await this.websiteRepo.create(model);
    return model.getId();
  }

  async update(id: string, website: WebsiteDTO) {
    // TODO: Check if website exists first
    const model = new WebsiteModel(
      id,
      website.name,
      website.hook
    );
    await this.websiteRepo.update(model);
  }

  async delete(id: string) {
    await this.websiteRepo.delete(id);
  }
}
