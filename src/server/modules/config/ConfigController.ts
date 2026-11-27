import type { Request, Response } from 'express';
import Controller from '../Controller';
import TimeService from '../common/TimeService';

export default class ConfigController extends Controller {
  private timeService: TimeService;

  constructor(timeService: TimeService) {
    super();
    this.timeService = timeService;
  }

  async getTimezones(req: Request, res: Response) {
    res.json(this.timeService.getTimezones());
  }
}
