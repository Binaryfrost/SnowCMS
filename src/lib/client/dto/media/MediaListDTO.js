import PaginatedDTO from '../PaginatedDTO.js';
import MediaWithUrlsDTO from './MediaWithUrlsDTO.js';

export default class MediaListDTO extends PaginatedDTO {
  #media;

  /**
   * @param {number} page
   * @param {number} pages
   * @param {MediaWithUrlsDTO[]} media
   */
  constructor(page, pages, media) {
    super(page, pages);
    this.#media = this.validator(media, 'media').required().array().getValue();
  }

  get media() {
    return this.#media;
  }

  static fromJSON(json) {
    return new MediaListDTO(
      json._metadata.page,
      json._metadata.pages,
      json.media.map((medium) => MediaWithUrlsDTO.fromJSON(medium))
    );
  }

  clone() {
    return new MediaListDTO(
      this._metadata.page,
      this._metadata.pages,
      this.media
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      media: this.media.map((medium) => medium.toJSON())
    };
  }
}
