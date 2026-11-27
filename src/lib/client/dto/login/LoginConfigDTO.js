import DTO from '../DTO.js';

export class SsoLoginConfigDTO extends DTO {
  #enabled;
  #forced;
  #text;

  /**
   * @param {boolean} enabled
   * @param {boolean} forced
   * @param {string} text
   */
  constructor(enabled, forced, text) {
    super();
    this.#enabled = this.validator(enabled, 'enabled').required().boolean().getValue();
    this.#forced = this.validator(forced, 'forced').required().boolean().getValue();
    this.#text = this.validator(text, 'text').required().string().getValue();
  }

  get enabled() {
    return this.#enabled;
  }

  get forced() {
    return this.#forced;
  }

  get text() {
    return this.#text;
  }

  clone() {
    return new SsoLoginConfigDTO(this.enabled, this.forced, this.text);
  }

  static fromJSON(json) {
    return new SsoLoginConfigDTO(json.enabled, json.forced, json.text);
  }

  toJSON() {
    return {
      enabled: this.enabled,
      forced: this.forced,
      text: this.text
    };
  }
}

export default class LoginConfigDTO extends DTO {
  #sso;
  #smtp;

  /**
   * @param {SsoLoginConfigDTO | null} sso
   * @param {boolean} smtp
   */
  constructor(sso, smtp) {
    super();
    this.#sso = this.validator(sso, 'sso').object().getValue();
    this.#smtp = this.validator(smtp, 'smtp').required().boolean().getValue();
  }

  get sso() {
    return this.#sso;
  }

  get smtp() {
    return this.#smtp;
  }

  clone() {
    return new LoginConfigDTO(this.sso?.clone(), this.smtp);
  }

  static fromJSON(json) {
    return new LoginConfigDTO(
      json.sso ? SsoLoginConfigDTO.fromJSON(json.sso) : null,
      json.smtp
    );
  }

  toJSON() {
    return {
      sso: this.sso?.toJSON() || null,
      smtp: this.smtp
    };
  }
}
