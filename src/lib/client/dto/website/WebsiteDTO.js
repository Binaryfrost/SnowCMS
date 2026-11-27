import DTO from '../DTO.js';

export default class WebsiteDTO extends DTO {
  #id;
  #name;
  #hook;

  /**
   * @param {string} id
   * @param {string} name
   * @param {string | null} hook
   */
  constructor(id, name, hook) {
    super();

    // ID is not mutable, so validation is done here
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.name = name;
    this.hook = hook;
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  set name(name) {
    this.#name = this.validator(name, 'name').required().string().getValue();
  }

  get hook() {
    return this.#hook;
  }

  set hook(hook) {
    this.#hook = this.validator(hook, 'hook').string().getValue();
  }

  clone() {
    return new WebsiteDTO(
      this.id,
      this.name,
      this.hook
    );
  }

  static fromJSON(json) {
    return new WebsiteDTO(
      json.id,
      json.name,
      json.hook
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      hook: this.hook
    };
  }
}
