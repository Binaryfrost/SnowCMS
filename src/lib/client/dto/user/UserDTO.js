import DTO from '../DTO.js';

export default class UserDTO extends DTO {
  #id;
  #email;
  #role;
  #active;
  #websites;

  /**
   * @param {string} id User ID
   * @param {string} email User email
   * @param {string} role The user's role, a string of enum ROLE_HIERARCHY
   * @param {boolean} active Whether user is active
   * @param {string[]} websites List of website IDs the user can access
   */
  constructor(id, email, role, active, websites) {
    super();

    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#email = this.validator(email, 'email').required().string().getValue();
    // TODO: See if it's possible to use enum Role here instead
    this.#role = this.validator(role, 'role').required().string().getValue();
    this.#active = this.validator(active, 'active').required().boolean().getValue();
    this.#websites = this.validator(websites, 'websites').required().array().of(
      (elem, name) => this.validator(elem, name).required().string()
    )
      .getValue();
  }

  get id() {
    return this.#id;
  }

  get email() {
    return this.#email;
  }

  get role() {
    return this.#role;
  }

  get active() {
    return this.#active;
  }

  get websites() {
    return this.#websites;
  }

  clone() {
    return new UserDTO(
      this.id,
      this.email,
      this.role,
      this.active,
      this.websites,
    );
  }

  static fromJSON(json) {
    return new UserDTO(
      json.id,
      json.email,
      json.role,
      json.active,
      json.websites,
    );
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      active: this.active,
      websites: this.#websites
    };
  }
}
