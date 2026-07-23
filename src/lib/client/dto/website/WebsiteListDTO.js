import PaginatedDTO from '../PaginatedDTO.js';
import WebsiteDTO from './WebsiteDTO.js';

export default class WebsiteListDTO extends PaginatedDTO {
  #websites;

  /**
   * @param {number} page
   * @param {number} pages
   * @param {WebsiteDTO[]} websites
   */
  constructor(page, pages, websites) {
    super(page, pages);
    this.#websites = websites;
  }

  get websites() {
    return this.#websites;
  }

  clone() {
    return new WebsiteListDTO(
      this._metadata.page,
      this._metadata.pages,
      this.websites
    );
  }

  static fromJSON(json) {
    return new WebsiteListDTO(
      json._metadata.page,
      json._metadata.pages,
      json.websites.map(({ id, name, hook }) => new WebsiteDTO(id, name, hook))
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      websites: this.websites.map((website) => website.toJSON())
    };
  }
}
