import { secureRandom } from '../../../util';
import Model from '../../Model';
import { Role } from '../UserRepository';

export default class ApiKeyModel extends Model {
  private id: string;
  private key: string;
  private userId: string;
  private name: string;
  private role: Role;
  private active: boolean;

  constructor(id: string, key: string, userId: string, name: string, role: Role, active: boolean) {
    super();
    this.id = id;
    this.key = key;
    this.userId = userId;
    this.name = name;
    this.role = role;
    this.active = active;
  }

  getId() {
    return this.id;
  }

  getKey() {
    return this.key;
  }

  resetKey() {
    const key = ApiKeyModel.generateKey();
    this.key = key;
    return key;
  }

  static generateKey() {
    return secureRandom(32, 'base64url');
  }

  getUserId() {
    return this.userId;
  }

  getName() {
    return this.name;
  }

  setName(name: string) {
    this.name = name;
  }

  getRole() {
    return this.role;
  }

  setRole(role: Role) {
    this.role = role;
  }

  isActive() {
    return this.active;
  }

  setActive(active: boolean) {
    this.active = active;
  }
}
