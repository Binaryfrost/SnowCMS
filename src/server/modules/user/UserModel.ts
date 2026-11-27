import { hash } from 'bcrypt';
import Model from '../Model';
import type { Role } from './UserRepository';

export default class UserModel extends Model {
  private id: string;
  private email: string;
  private passwordHash: string;
  private role: Role;
  private active: boolean;

  constructor(id: string, email: string, passwordHash: string, role: Role, active: boolean) {
    super();
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.active = active;
  }

  getId() {
    return this.id;
  }

  getEmail() {
    return this.email;
  }

  setEmail(email: string) {
    this.email = email;
  }

  getPasswordHash() {
    return this.passwordHash;
  }

  setPasswordHash(passwordHash: string) {
    this.passwordHash = passwordHash;
  }

  static async hashPassword(password: string) {
    return hash(password, 10);
  }

  async setPassword(password: string) {
    this.passwordHash = await UserModel.hashPassword(password);
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
