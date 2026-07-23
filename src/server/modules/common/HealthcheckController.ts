import type { Request, Response } from 'express';
import Controller from '../Controller';

export default class HealthcheckController extends Controller {
  healthcheck(req: Request, res: Response) {
    res.json({
      status: 'OK'
    });
  }
}
