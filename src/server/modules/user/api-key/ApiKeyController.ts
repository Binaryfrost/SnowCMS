import type { Request, Response } from 'express';
import ForbiddenError from '../../../../common/errors/base/ForbiddenError';
import NotFoundError from '../../../../common/errors/base/NotFoundError';
import UnauthorizedError from '../../../../common/errors/base/UnauthorizedError';
import ApiKeySecretDTO from '../../../../lib/client/dto/user/api-key/ApiKeySecretDTO';
import CreateUpdateApiKeyDTO from '../../../../lib/client/dto/user/api-key/CreateUpdateApiKeyDTO';
import { SuccessDTOBuilder } from '../../../../lib/client/dto/SuccessDTO';
import Controller from '../../Controller';
import UserService from '../UserService';
import ApiKeyService from './ApiKeyService';

export default class ApiKeyController extends Controller {
  private apiKeyService: ApiKeyService;
  private userService: UserService;

  constructor(apiKeyService: ApiKeyService, userService: UserService) {
    super();
    this.apiKeyService = apiKeyService;
    this.userService = userService;
  }

  async getAll(req: Request, res: Response) {
    const { userId } = req.params;
    this.handleUserAccessControl(req.user, userId);
    await this.ensureUserExists(userId);

    const dto = await this.apiKeyService.getAllUserApiKeys(userId, this.getPaginationOpts(req));
    res.json(dto.toJSON());
  }

  async create(req: Request, res: Response) {
    const { userId } = req.params;
    this.handleUserAccessControl(req.user, userId);
    const accountUser = await this.ensureUserExists(userId);

    const apiKey = CreateUpdateApiKeyDTO.fromJSON(req.body);
    const created = await this.apiKeyService.create(userId, accountUser, req.user, apiKey);

    res.json(new ApiKeySecretDTO(created.id, created.key, 'Created API key').toJSON());
  }

  async get(req: Request, res: Response) {
    const { userId, keyId } = req.params;
    this.handleUserAccessControl(req.user, userId);
    await this.ensureUserExists(userId);

    const apiKey = await this.apiKeyService.getApiKey(keyId);
    res.json(apiKey.toJSON());
  }

  async update(req: Request, res: Response) {
    const { userId, keyId } = req.params;
    this.handleUserAccessControl(req.user, userId);
    const accountUser = await this.ensureUserExists(userId);

    const apiKey = CreateUpdateApiKeyDTO.fromJSON(req.body);
    await this.apiKeyService.update(keyId, accountUser, req.user, apiKey);

    res.json(new SuccessDTOBuilder()
      .withMessage('Edited API key')
      .build()
      .toJSON());
  }

  async reset(req: Request, res: Response) {
    const { userId, keyId } = req.params;
    this.handleUserAccessControl(req.user, userId);
    await this.ensureUserExists(userId);

    const key = await this.apiKeyService.resetApiKey(keyId);

    res.json(new ApiKeySecretDTO(keyId, key, 'Reset API key').toJSON());
  }

  async delete(req: Request, res: Response) {
    const { userId, keyId } = req.params;
    this.handleUserAccessControl(req.user, userId);
    await this.ensureUserExists(userId);

    await this.apiKeyService.delete(keyId);

    res.json(new SuccessDTOBuilder()
      .withMessage('API key deleted')
      .build()
      .toJSON());
  }

  private handleUserAccessControl(user, userId: string) {
    if (!user) {
      throw new UnauthorizedError();
    }

    if (user.role === 'ADMIN') return;

    if (user.id !== userId || user.role === 'VIEWER') {
      throw new ForbiddenError();
    }
  }

  private async ensureUserExists(userId: string) {
    const user = await this.userService.getUser(userId);
    if (!user) throw new NotFoundError('User does not exist');
    return user;
  }
}
