import DTO from '../DTO.js';

export default class CreateUpdateWebsiteDTO extends DTO {
  /** @type {string} */
  #name;
  /** @type {string} */
  #hook;

  /**
   * @param {string} name
   * @param {string | null} hook
   */
  constructor(name, hook) {
    super();
    this.name = name;
    this.hook = hook;
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
    return new CreateUpdateWebsiteDTO(
      this.name,
      this.hook
    );
  }

  static fromJSON(json) {
    return new CreateUpdateWebsiteDTO(
      json.name,
      json.hook
    );
  }

  toJSON() {
    return {
      name: this.name,
      hook: this.hook
    };
  }
}
