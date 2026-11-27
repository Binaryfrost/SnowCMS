import { compare } from 'bcrypt';
import InvalidCredentialsError from '../../../common/errors/InvalidCredentialsError';
import BadRequestError from '../../../common/errors/base/BadRequestError';
import NotFoundError from '../../../common/errors/base/NotFoundError';
import { ROLE_HIERARCHY } from '../../../common/users';
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

  async getActiveUserIfExists(email: string) {
    const user = await this.getUserByEmail(email);
    if (!user || !user.active) return null;
    return user;
  }

  async getUserIfCredentialsCorrect(email: string, password: string) {
    const user = await this.userRepo.getUserByEmail(email);
    if (!user || !user.isActive()) {
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

  async emailIsInUse(email: string, exceptUserId?: string) {
    const user = await this.userRepo.getUserByEmail(email);
    if (!user) return false;
    if (exceptUserId && user.getId() === exceptUserId) return false;
    return true;
  }

  async create(user: CreateUserDTO) {
    if (!user.email.includes('@')) {
      throw new BadRequestError('Invalid email');
    }

    if (!(user.role in ROLE_HIERARCHY)) {
      throw new BadRequestError('Invalid role');
    }

    if (await this.emailIsInUse(user.email)) {
      throw new BadRequestError('User with that email address already exists');
    }

    const model = new UserModel(
      UserModel.generateId(),
      user.email,
      await UserModel.hashPassword(user.password),
      user.role as Role,
      user.active
    );
    await this.userRepo.create(model);
    await this.changeUserWebsites(model.getId(), user.websites);
    return model.getId();
  }

  async update(id: string, user: UpdateUserDTO) {
    if (!user.email.includes('@')) {
      throw new BadRequestError('Invalid email');
    }

    if (!(user.role in ROLE_HIERARCHY)) {
      throw new BadRequestError('Invalid role');
    }

    if (await this.emailIsInUse(user.email, id)) {
      throw new BadRequestError('User with that email address already exists');
    }

    const model = new UserModel(
      id,
      user.email,
      // Usually password wouldn't be nullable, but there's special handling for updates
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

  async setPassword(id: string, password: string) {
    const user = await this.userRepo.getUserById(id);
    if (!user || !user.isActive()) throw new NotFoundError('User not found');

    const model = new UserModel(
      id,
      user.getEmail(),
      await UserModel.hashPassword(password),
      user.getRole(),
      true
    );
    await this.userRepo.updatePassword(id, model.getPasswordHash());
    await this.userCacheService.invalidateCachedUser(id);
  }

  async removeWebsiteAccess(websiteId: string) {
    await this.userRepo.removeWebsiteAccess(websiteId);
  }
}
