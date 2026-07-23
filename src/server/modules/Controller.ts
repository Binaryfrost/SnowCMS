import { Request, Response } from 'express';
import MvcObject from './MvcObject';

export type ControllerMethod = (req: Request, res: Response) => void | Promise<void>;

export default class Controller extends MvcObject {

}
