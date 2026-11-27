import { v7 as uuid } from 'uuid';
import MvcObject from './MvcObject';

export default class Model extends MvcObject {
  static generateId() {
    return uuid();
  }
}
