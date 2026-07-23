import DTO from '../DTO';

export default class CreateCollectionDTO extends DTO {
  /** @type {string} */
  #name;
  /** @type {boolean} */
  #callHook;

  /**
   * @param {string} name
   * @param {boolean} callHook
   */
  constructor(name, callHook) {
    super();
    this.name = name;
    this.callHook = callHook;
  }

  get name() {
    return this.#name;
  }

  set name(name) {
    this.#name = this.validator(name, 'name').required().string().getValue();
  }

  get callHook() {
    return this.#callHook;
  }

  set callHook(callHook) {
    this.#callHook = this.validator(callHook, 'callHook').required().boolean().getValue();
  }

  clone() {
    return new CreateCollectionDTO(this.name, this.callHook);
  }

  static fromJSON(json) {
    return new CreateCollectionDTO(json.name, json.callHook);
  }

  toJSON() {
    return {
      name: this.name,
      callHook: this.callHook
    };
  }
}
