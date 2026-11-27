import DTO from '../../DTO.js';

export default class CreateUpdateApiKeyDTO extends DTO {
  /** @type {string} */
  #name;
  /** @type {string} */
  #role;
  /** @type {boolean} */
  #active;
  /** @type {string[]} */
  #websites;

  /**
   * @param {string} name API key name
   * @param {string} role The API key's role, a string of enum ROLE_HIERARCHY
   * @param {boolean} active Whether API key is active
   * @param {string[]} websites List of website IDs the API key can access
   */
  constructor(name, role, active, websites) {
    super();

    this.name = name;
    this.role = role;
    this.active = active;
    this.websites = websites;
  }

  get name() {
    return this.#name;
  }

  set name(name) {
    this.#name = this.validator(name, 'name').required().string().getValue();
  }

  get role() {
    return this.#role;
  }

  set role(role) {
    // TODO: See if it's possible to use enum Role here instead
    this.#role = this.validator(role, 'role').required().string().getValue();
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
      (elem, n) => this.validator(elem, n).required().string()
    )
      .getValue();
  }

  clone() {
    return new CreateUpdateApiKeyDTO(
      this.name,
      this.role,
      this.active,
      this.websites,
    );
  }

  static fromJSON(json) {
    return new CreateUpdateApiKeyDTO(
      json.name,
      json.role,
      json.active,
      json.websites,
    );
  }

  toJSON() {
    return {
      name: this.name,
      role: this.role,
      active: this.active,
      websites: this.websites
    };
  }
}
