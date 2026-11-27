import DTO from '../../DTO.js';

export default class ApiKeySecretDTO extends DTO {
  #id;
  #key;
  #message;

  /**
   * @param {string} id
   * @param {string} key The full API key secret
   * @param {string | null} [message]
   */
  constructor(id, key, message) {
    super();
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#key = this.validator(key, 'key').required().string().getValue();
    this.#message = this.validator(message, 'message').string().getValue();
  }

  get id() {
    return this.#id;
  }

  get key() {
    return this.#key;
  }

  get message() {
    return this.#message;
  }

  clone() {
    return new ApiKeySecretDTO(this.id, this.key, this.message);
  }

  static fromJSON(json) {
    return new ApiKeySecretDTO(json.id, json.key, json.message);
  }

  toJSON() {
    return {
      id: this.id,
      key: this.key,
      message: this.message
    };
  }
}
