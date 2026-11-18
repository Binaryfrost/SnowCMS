import { Request, Response } from 'express';
import MvcObject from './MvcObject';

export type ControllerMethod = (req: Request, res: Response) => void | Promise<void>;

export default class Controller extends MvcObject {
  protected getPaginationOpts(req: Request): {
    limit: number
    page: number
    sort: 'asc' | 'desc'
  } {
    const limit = parseInt(req.query.limit as string, 10);
    const page = parseInt(req.query.page as string, 10);
    const sort = (req.query.sort as string) || 'asc';

    return {
      limit: Number.isNaN(limit) ? 10 : limit,
      page: Number.isNaN(page) ? 1 : page,
      sort: sort === 'desc' ? 'desc' : 'asc'
    };
  }
}
