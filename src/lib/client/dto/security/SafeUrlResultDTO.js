import DTO from '../DTO.js';

export default class SafeUrlResultDTO extends DTO {
  #safe;
  #hostname;

  /**
   * @param {boolean} safe
   * @param {string | null} hostname
   */
  constructor(safe, hostname) {
    super();
    this.#safe = this.validator(safe, 'safe').required().boolean().getValue();
    this.#hostname = this.validator(hostname, 'hostname').string().getValue();
  }

  get safe() {
    return this.#safe;
  }

  get hostname() {
    return this.#hostname;
  }

  clone() {
    return new SafeUrlResultDTO(this.safe, this.hostname);
  }

  static fromJSON(json) {
    return new SafeUrlResultDTO(json.safe, json.hostname);
  }

  toJSON() {
    return {
      safe: this.safe,
      hostname: this.hostname
    };
  }
}
