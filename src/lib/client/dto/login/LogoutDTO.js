import DTO from '../DTO.js';

export default class LogoutDTO extends DTO {
  #redirect;

  /**
   * @param {string} redirect
   */
  constructor(redirect) {
    super();
    this.#redirect = this.validator(redirect, 'redirect').required().string().getValue();
  }

  get redirect() {
    return this.#redirect;
  }

  clone() {
    return new LogoutDTO(this.redirect);
  }

  static fromJSON(json) {
    return new LogoutDTO(json.redirect);
  }

  toJSON() {
    return {
      redirect: this.redirect
    };
  }
}
