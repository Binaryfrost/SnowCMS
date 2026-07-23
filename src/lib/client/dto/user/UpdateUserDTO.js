import DTO from '../DTO.js';

export default class UpdateUserDTO extends DTO {
  /** @type {string} */
  #email;
  /** @type {string} */
  #role;
  /** @type {string} */
  #password;
  /** @type {boolean} */
  #active;
  /** @type {string[]} */
  #websites;

  /**
   * @param {string} email User email
   * @param {string} role The user's role, a string of enum ROLE_HIERARCHY
   * @param {string} password Unhashed user password
   * @param {boolean} active Whether user is active
   * @param {string[]} websites List of website IDs the user can access
   */
  constructor(email, role, password, active, websites) {
    super();

    this.email = email;
    this.role = role;
    this.password = password;
    this.active = active;
    this.websites = websites;
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
    this.#password = this.validator(password, 'password').string().getValue();
  }

  get active() {
    return this.#active;
  }

  set active(active) {
    this.#active = this.validator(active, 'active').required().boolean().getValue();
  }

  get websites() {
    return this.#websites;
  }

  set websites(websites) {
    this.#websites = this.validator(websites, 'websites').required().array().of(
      (elem, name) => this.validator(elem, name).required().string()
    )
      .getValue();
  }

  clone() {
    return new UpdateUserDTO(
      this.email,
      this.role,
      this.password,
      this.active,
      this.websites
    );
  }

  static fromJSON(json) {
    return new UpdateUserDTO(
      json.email,
      json.role,
      json.password,
      json.active,
      json.websites
    );
  }

  toJSON() {
    return {
      email: this.email,
      role: this.role,
      password: this.password,
      active: this.active,
      websites: this.websites
    };
  }
}
