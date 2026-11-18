/* eslint-disable prefer-destructuring */
import { timingSafeEqual } from 'crypto';
import InvalidApiKeyFormatError from '../../../../common/errors/InvalidApiKeyFormatError';
import BadRequestError from '../../../../common/errors/base/BadRequestError';
import ForbiddenError from '../../../../common/errors/base/ForbiddenError';
import NotFoundError from '../../../../common/errors/base/NotFoundError';
import { ROLE_HIERARCHY } from '../../../../common/users';
import UserDTO from '../../../../lib/client/dto/user/UserDTO';
import ApiKeyDTO from '../../../../lib/client/dto/user/api-key/ApiKeyDTO';
import ApiKeyListDTO from '../../../../lib/client/dto/user/api-key/ApiKeyListDTO';
import ApiKeySecretDTO from '../../../../lib/client/dto/user/api-key/ApiKeySecretDTO';
import CreateUpdateApiKeyDTO from '../../../../lib/client/dto/user/api-key/CreateUpdateApiKeyDTO';
import PaginatedQuery, { PaginatedQueryOpts } from '../../../database/PaginatedQuery';
import Service from '../../Service';
import { Role } from '../UserRepository';
import ApiKeyModel from './ApiKeyModel';
import ApiKeyRepository from './ApiKeyRepository';

export default class ApiKeyService extends Service {
  private apiKeyRepo: ApiKeyRepository;

  constructor(apiKeyRepo: ApiKeyRepository) {
    super();
    this.apiKeyRepo = apiKeyRepo;
  }

  async getAllApiKeys(opts?: PaginatedQueryOpts) {
    const query = await this.apiKeyRepo.getApiKeys(opts);
    return this.adaptToDTO(opts?.page || 1, query);
  }

  async getAllUserApiKeys(user: UserDTO | string, opts?: PaginatedQueryOpts) {
    const userId = typeof user === 'string' ? user : user.id;
    const query = await this.apiKeyRepo.getUserApiKeys(userId, opts);
    return this.adaptToDTO(opts?.page || 1, query);
  }

  private async adaptToDTO(page: number, paginatedClient: PaginatedQuery<ApiKeyModel>) {
    const { pages } = await paginatedClient.metadata();
    const apiKeys = await paginatedClient.getPage(page);

    return new ApiKeyListDTO(
      page,
      pages,
      await Promise.all(apiKeys.map(
        async (apiKey) => new ApiKeyDTO(
          apiKey.getId(),
          apiKey.getUserId(),
          apiKey.getName(),
          apiKey.getRole(),
          apiKey.isActive(),
          await this.apiKeyRepo.getApiKeyWebsites(apiKey.getId())
        )
      ))
    );
  }

  async getApiKey(id: string) {
    const apiKey = await this.apiKeyRepo.getApiKeyById(id);
    if (!apiKey) throw new NotFoundError('API key does not exist');

    return new ApiKeyDTO(
      apiKey.getId(),
      apiKey.getUserId(),
      apiKey.getName(),
      apiKey.getRole(),
      apiKey.isActive(),
      await this.apiKeyRepo.getApiKeyWebsites(id)
    );
  }

  async validateSecret(id: string, secret: string) {
    const apiKey = await this.apiKeyRepo.getApiKeyById(id);
    if (!apiKey) return false;
    return this.secureCompare(secret, apiKey.getKey());
  }

  private secureCompare(a: string, b: string) {
    if (!a || !b) return false;

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) return false;

    return timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Parses the API key ID from a full API key in the format `a:${id}.${secret}`.
   * @param apiKey Full API key
   */
  parseIdFromKey(apiKey: string) {
    const apiKeyParts = apiKey.split(':');
    if (apiKeyParts.length !== 2 || apiKeyParts[0] !== 'a') {
      throw new InvalidApiKeyFormatError();
    }

    const [id] = apiKeyParts[1].split('.');
    if (!id) throw new InvalidApiKeyFormatError();

    return id;
  }

  parseSecretFromKey(apiKey: string) {
    const apiKeyParts = apiKey.split(':');
    if (apiKeyParts.length !== 2 || apiKeyParts[0] !== 'a') {
      throw new InvalidApiKeyFormatError();
    }

    const [, secret] = apiKeyParts[1].split('.');
    if (!secret) throw new InvalidApiKeyFormatError();

    return secret;
  }

  async getApiKeyWebsites(apiKey: string) {
    const id = await this.parseIdFromKey(apiKey);
    return this.apiKeyRepo.getApiKeyWebsites(id);
  }

  async changeApiKeyWebsites(apiKeyId: string, websites: string[]) {
    const userWebsites = await this.apiKeyRepo.getApiKeyWebsites(apiKeyId);
    const websitesToAdd = websites.filter((website) => !userWebsites.includes(website));
    const websitesToRemove = userWebsites.filter((website) => !websites.includes(website));

    if (websitesToAdd.length > 0) {
      await this.apiKeyRepo.addApiKeyWebsites(apiKeyId, websitesToAdd);
    }

    if (websitesToRemove.length > 0) {
      await this.apiKeyRepo.deleteApiKeyWebsites(apiKeyId, websitesToRemove);
    }
  }

  async validateWebsites(user: UserDTO, websites: string[]) {
    if (!Array.isArray(websites)) {
      throw new BadRequestError('Websites must be an array');
    }

    if (user.role !== 'ADMIN' && !websites.every((w) => user.websites.includes(w))) {
      throw new ForbiddenError('User does not have access to one or more websites');
    }
  }

  async create(
    userId: string,
    accountUser: UserDTO,
    loggedInUser: UserDTO,
    apiKey: CreateUpdateApiKeyDTO
  ) {
    if (!(apiKey.role in ROLE_HIERARCHY)) {
      throw new BadRequestError('Invalid role');
    }

    await this.validateWebsites(accountUser, apiKey.websites);

    if (ROLE_HIERARCHY[apiKey.role as Role] > ROLE_HIERARCHY[loggedInUser.role]) {
      throw new ForbiddenError('API key cannot have higher role than user');
    }

    const apiKeyId = ApiKeyModel.generateId();
    const key = ApiKeyModel.generateKey();
    const model = new ApiKeyModel(
      apiKeyId,
      key,
      userId,
      apiKey.name,
      apiKey.role as Role,
      apiKey.active
    );
    await this.apiKeyRepo.create(model);
    await this.changeApiKeyWebsites(apiKeyId, apiKey.websites);
    return new ApiKeySecretDTO(apiKeyId, key);
  }

  async update(
    id: string,
    accountUser: UserDTO,
    loggedInUser: UserDTO,
    apiKey: CreateUpdateApiKeyDTO
  ) {
    if (!(apiKey.role in ROLE_HIERARCHY)) {
      throw new BadRequestError('Invalid role');
    }

    await this.validateWebsites(accountUser, apiKey.websites);

    if (ROLE_HIERARCHY[apiKey.role as Role] > ROLE_HIERARCHY[loggedInUser.role]) {
      throw new ForbiddenError('API key cannot have higher role than user');
    }

    const model = new ApiKeyModel(
      id,
      // Usually the key wouldn't be nullable, but there's special handling for updates
      null,
      null,
      apiKey.name,
      apiKey.role as Role,
      apiKey.active
    );
    await this.apiKeyRepo.update(model);
    await this.changeApiKeyWebsites(id, apiKey.websites);
  }

  async resetApiKey(id: string) {
    const apiKey = await this.apiKeyRepo.getApiKeyById(id);
    if (!apiKey) throw new NotFoundError('API key does not exist');

    const newKey = ApiKeyModel.generateKey();
    this.apiKeyRepo.updateKey(id, newKey);
    return newKey;
  }

  async delete(id: string) {
    await this.apiKeyRepo.delete(id);
  }

  async removeWebsiteAccess(websiteId: string) {
    await this.apiKeyRepo.removeWebsiteAccess(websiteId);
  }
}
