import DTO from './DTO';

export class SuccessDTOBuilder {
  /** @param {string} message  */
  withMessage(message) {
    this.message = message;
    return this;
  }

  /** @param {string} id */
  withId(id) {
    this.id = id;
    return this;
  }

  /** @returns {SuccessDTO} */
  build() {
    return new SuccessDTO(this.message, this.id);
  }
}

export default class SuccessDTO extends DTO {
  #message;
  #id;

  /**
   * @private
   * @param {string} message
   * @param {string} id
   */
  constructor(message, id) {
    super();

    if (message) this.#message = message;
    if (id) this.#id = id;
  }

  get message() {
    return this.#message;
  }

  get id() {
    return this.#id;
  }

  clone() {
    return new SuccessDTO(this.message, this.id);
  }

  static fromJSON(json) {
    return new SuccessDTO(json.message, json.id);
  }

  /** @returns {{ message?: string, id?: string }} */
  toJSON() {
    const obj = {};
    if (this.#message) obj.message = this.#message;
    if (this.#id) obj.id = this.#id;
    return obj;
  }
}
