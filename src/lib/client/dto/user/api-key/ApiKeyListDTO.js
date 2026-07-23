import PaginatedDTO from '../../PaginatedDTO.js';
import ApiKeyDTO from './ApiKeyDTO.js';

export default class ApiKeyListDTO extends PaginatedDTO {
  #apiKeys;
  /**
   * @param {number} page
   * @param {number} pages
   * @param {ApiKeyDTO[]} apiKeys
   */
  constructor(page, pages, apiKeys) {
    super(page, pages);
    this.#apiKeys = this.validator(apiKeys, 'apiKeys').required().array().getValue();
  }

  get apiKeys() {
    return this.#apiKeys;
  }

  clone() {
    return new ApiKeyListDTO(
      this._metadata.page,
      this._metadata.pages,
      this.apiKeys
    );
  }

  static fromJSON(json) {
    return new ApiKeyListDTO(
      json._metadata.page,
      json._metadata.pages,
      json.apiKeys.map(({
        id, name, role, active, websites
      }) => new ApiKeyDTO(id, name, role, active, websites))
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      apiKeys: this.apiKeys.map((apiKey) => apiKey.toJSON())
    };
  }
}
