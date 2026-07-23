import DTO from '../DTO.js';

export default class CreateUserDTO extends DTO {
  /** @type {string} */
  #email;
  /** @type {string} */
  #role;
  /** @type {string} */
  #password;
  /** @type {boolean} */
  #active;

  /**
   * @param {string} email User email
   * @param {string} role The user's role, a string of enum ROLE_HIERARCHY
   * @param {string} password Unhashed user password
   * @param {boolean} active Whether user is active
   */
  constructor(email, role, password, active) {
    super();
    this.email = email;
    this.role = role;
    this.password = password;
    this.active = active;
  }

  get email() {
    return this.#email;
  }

  set email(email) {
    this.#email = this.validator(email, 'email').required().string().getValue();
  }

  get role() {
    return this.#role;
  }

  set role(role) {
    // TODO: See if it's possible to use enum Role here instead
    this.#role = this.validator(role, 'role').required().string().getValue();
  }

  get password() {
    return this.#password;
  }

  set password(password) {
    this.#password = this.validator(password, 'password').required().string().getValue();
  }

  get active() {
    return this.#active;
  }

  set active(active) {
    this.#active = this.validator(active, 'active').required().boolean().getValue();
  }

  clone() {
    return new CreateUserDTO(
      this.email,
      this.role,
      this.password,
      this.active
    );
  }

  static fromJSON(json) {
    return new CreateUserDTO(
      json.email,
      json.role,
      json.password,
      json.active
    );
  }

  toJSON() {
    return {
      email: this.email,
      role: this.role,
      password: this.password,
      active: this.active
    };
  }
}
