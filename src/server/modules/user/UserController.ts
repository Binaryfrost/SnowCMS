import type { Request, Response } from 'express';
import BadRequestError from '../../../common/errors/base/BadRequestError';
import ForbiddenError from '../../../common/errors/base/ForbiddenError';
import NotFoundError from '../../../common/errors/base/NotFoundError';
import UnauthorizedError from '../../../common/errors/base/UnauthorizedError';
import CreateUserDTO from '../../../lib/client/dto/user/CreateUserDTO';
import UpdateUserDTO from '../../../lib/client/dto/user/UpdateUserDTO';
import { SuccessDTOBuilder } from '../../../lib/client/dto/SuccessDTO';
import Controller from '../Controller';
import SessionService from '../session/SessionService';
import UserService from './UserService';

export default class UserController extends Controller {
  private userService: UserService;
  private sessionService: SessionService;

  constructor(userService: UserService, sessionService: SessionService) {
    super();
    this.userService = userService;
    this.sessionService = sessionService;
  }

  async getAll(req: Request, res: Response) {
    const dto = await this.userService.getAllUsers(this.getPaginationOpts(req));
    res.json(dto.toJSON());
  }

  async create(req: Request, res: Response) {
    const user = CreateUserDTO.fromJSON(req.body);
    const id = await this.userService.create(user);

    res.json(new SuccessDTOBuilder()
      .withMessage('Created account')
      .withId(id)
      .build()
      .toJSON());
  }

  async getMe(req: Request, res: Response) {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    res.json(req.user.toJSON());
  }

  async get(req: Request, res: Response) {
    const { userId } = req.params;
    this.handleUserAccessControl(req.user, userId);
    await this.ensureUserExists(userId);

    const user = await this.userService.getUser(userId);
    res.json(user.toJSON());
  }

  async update(req: Request, res: Response) {
    const { userId } = req.params;
    this.handleUserAccessControl(req.user, userId);
    await this.ensureUserExists(userId);

    const user = UpdateUserDTO.fromJSON(req.body);

    if (!user.email || !user.role || !user.websites) {
      throw new BadRequestError('Email, role, and websites are required');
    }

    if (req.user.role !== 'ADMIN') {
      const existing = await this.userService.getUser(userId);

      if (existing.role !== user.role || existing.active !== user.active ||
        existing.websites.length !== user.websites.length ||
        !existing.websites.every((w) => user.websites.includes(w))) {
        throw new BadRequestError(
          'Non-admin users cannot modify their own role, websites, or active status'
        );
      }
    }

    const passwordChanged = !!user.password;
    await this.userService.update(userId, user);

    if (passwordChanged) {
      const currentToken = req.sessionToken;
      await this.sessionService.deleteAllSessionsFor(
        userId,
        (key) => key !== `session:${currentToken}`
      );
    }

    res.json(new SuccessDTOBuilder()
      .withMessage('Account edited')
      .build()
      .toJSON());
  }

  async delete(req: Request, res: Response) {
    const { userId } = req.params;
    await this.ensureUserExists(userId);
    await this.userService.delete(userId);

    res.json(new SuccessDTOBuilder()
      .withMessage('Account deleted')
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
  }
}
