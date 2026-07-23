/* eslint-disable prefer-destructuring */
import InvalidApiKeyFormatError from '../../../../common/errors/InvalidApiKeyFormatError';
import UserDTO from '../../../../lib/client/dto/user/UserDTO';
import ApiKeyDTO from '../../../../lib/client/dto/user/api-key/ApiKeyDTO';
import ApiKeyListDTO from '../../../../lib/client/dto/user/api-key/ApiKeyListDTO';
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
          apiKey.getName(),
          apiKey.getRole(),
          apiKey.isActive(),
          await this.apiKeyRepo.getApiKeyWebsites(apiKey.getId())
        )
      ))
    );
  }

  async parseIdFromKey(apiKey: string) {
    const apiKeyParts = apiKey.split(':');
    switch (apiKeyParts.length) {
      // Key ID
      case 1:
        return apiKeyParts[0];
      // Full API key in format a:${keyId}:${keySecret}
      case 3:
        return apiKeyParts[1];
      default:
        throw new InvalidApiKeyFormatError();
    }
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

  async resetApiKey(id: string) {
    // TODO: Check if key exists. Do same for other methods on all services, where appropriate
    const newKey = ApiKeyModel.generateKey();
    this.apiKeyRepo.updateKey(id, newKey);
    return newKey;
  }

  async create(userId: string, apiKey: CreateUpdateApiKeyDTO) {
    const apiKeyId = ApiKeyModel.generateId();
    const model = new ApiKeyModel(
      apiKeyId,
      ApiKeyModel.generateKey(),
      userId,
      apiKey.name,
      apiKey.role as Role,
      apiKey.active
    );
    await this.apiKeyRepo.create(model);
    await this.changeApiKeyWebsites(apiKeyId, apiKey.websites);
    return model.getId();
  }

  async update(id: string, apiKey: CreateUpdateApiKeyDTO) {
    const model = new ApiKeyModel(
      id,
      // @ts-expect-error Usually the key wouldn't be nullable, but there's special handling for updates
      null,
      null,
      apiKey.name,
      apiKey.role as Role,
      apiKey.active
    );
    await this.apiKeyRepo.update(model);
    await this.changeApiKeyWebsites(id, apiKey.websites);
  }

  async delete(id: string) {
    await this.apiKeyRepo.delete(id);
  }
}
