import DTO from '../../DTO.js';

export default class ApiKeyDTO extends DTO {
  #id;
  #name;
  #role;
  #active;
  #websites;

  /**
   * @param {string} id API key ID
   * @param {string} name API key name
   * @param {string} role The API key's role, a string of enum ROLE_HIERARCHY
   * @param {boolean} active Whether API key is active
   * @param {string[]} websites List of website IDs the API key can access
   */
  constructor(id, name, role, active, websites) {
    super();

    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#name = this.validator(name, 'name').required().string().getValue();
    // TODO: See if it's possible to use enum Role here instead
    this.#role = this.validator(role, 'role').required().string().getValue();
    this.#active = this.validator(active, 'active').required().boolean().getValue();
    this.#websites = this.validator(websites, 'websites').required().array().of(
      (elem, n) => this.validator(elem, n).required().string()
    )
      .getValue();
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
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
    return new ApiKeyDTO(
      this.id,
      this.name,
      this.role,
      this.active,
      this.websites,
    );
  }

  static fromJSON(json) {
    return new ApiKeyDTO(
      json.id,
      json.name,
      json.role,
      json.active,
      json.websites,
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      active: this.active,
      websites: this.websites
    };
  }
}
