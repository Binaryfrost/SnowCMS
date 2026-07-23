import { compare } from 'bcrypt';
import InvalidCredentialsError from '../../../common/errors/InvalidCredentialsError';
import NotFoundError from '../../../common/errors/base/NotFoundError';
import Service from '../Service';
import UserCacheService from './UserCacheService';
import UserModel from './UserModel';
import UserRepository, { Role } from './UserRepository';
import PaginatedQuery, { PaginatedQueryOpts } from '../../database/PaginatedQuery';
import UserDTO from '../../../lib/client/dto/user/UserDTO';
import UserListDTO from '../../../lib/client/dto/user/UserListDTO';
import CreateUserDTO from '../../../lib/client/dto/user/CreateUserDTO';
import UpdateUserDTO from '../../../lib/client/dto/user/UpdateUserDTO';

export default class UserService extends Service {
  private userRepo: UserRepository;
  private userCacheService: UserCacheService;

  constructor(userRepo: UserRepository, userCacheService: UserCacheService) {
    super();
    this.userRepo = userRepo;
    this.userCacheService = userCacheService;
  }

  async getAllUsers(opts?: PaginatedQueryOpts) {
    const query = await this.userRepo.getAllUsers(opts);
    return this.adaptUsers(opts?.page || 1, query);
  }

  async getUser(id: string) {
    const cached = await this.userCacheService.getCachedUser(id);
    if (cached) return cached;
    const user = await this.userRepo.getUserById(id);
    if (!user) return null;
    const serviceUser = await this.adaptUser(user);
    this.userCacheService.setCachedUser(serviceUser);
    return serviceUser;
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepo.getUserByEmail(email);
    if (!user) return null;
    return this.adaptUser(user);
  }

  private async adaptUser(user: UserModel): Promise<UserDTO> {
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const userWebsites = await this.userRepo.getUserWebsites(user.getId());

    return new UserDTO(
      user.getId(),
      user.getEmail(),
      user.getRole(),
      user.isActive(),
      userWebsites
    );
  }

  private async adaptUsers(page: number, paginatedClient: PaginatedQuery<UserModel>) {
    const { pages } = await paginatedClient.metadata();
    const users = await paginatedClient.getPage(page);

    return new UserListDTO(
      page,
      pages,
      await Promise.all(users.map((user) => this.adaptUser(user)))
    );
  }

  hasAccessToWebsite(user: UserDTO, websiteId: string) {
    if (user.role === 'ADMIN') return true;
    return user.websites.includes(websiteId);
  }

  async getUserIfCredentialsCorrect(email: string, password: string) {
    const user = await this.userRepo.getUserByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!await compare(password, user.getPasswordHash())) {
      throw new InvalidCredentialsError();
    }

    return this.adaptUser(user);
  }

  async changeUserWebsites(userId: string, websites: string[]) {
    const userWebsites = await this.userRepo.getUserWebsites(userId);
    const websitesToAdd = websites.filter((website) => !userWebsites.includes(website));
    const websitesToRemove = userWebsites.filter((website) => !websites.includes(website));

    if (websitesToAdd.length > 0) {
      await this.userRepo.addUserWebsites(userId, websitesToAdd);
    }

    if (websitesToRemove.length > 0) {
      await this.userRepo.deleteUserWebsites(userId, websitesToRemove);
    }
  }

  async create(user: CreateUserDTO) {
    const model = new UserModel(
      UserModel.generateId(),
      user.email,
      await UserModel.hashPassword(user.password),
      user.role as Role,
      user.active
    );
    await this.userRepo.create(model);
    return model.getId();
  }

  async update(id: string, user: UpdateUserDTO) {
    const model = new UserModel(
      id,
      user.email,
      // @ts-expect-error Usually password wouldn't be nullable, but there's special handling for updates
      user.password ? await UserModel.hashPassword(user.password) : null,
      user.role as Role,
      user.active
    );
    await this.userRepo.update(model);
    await this.changeUserWebsites(id, user.websites);
    await this.userCacheService.invalidateCachedUser(id);
  }

  async delete(id: string) {
    await this.userRepo.delete(id);
    await this.userCacheService.invalidateCachedUser(id);
  }
}
