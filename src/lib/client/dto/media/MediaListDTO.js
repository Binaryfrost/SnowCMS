import PaginatedDTO from '../PaginatedDTO';
import MediaDTO from './MediaDTO';

export default class MediaListDTO extends PaginatedDTO {
  #media;

  /**
   * @param {number} page
   * @param {number} pages
   * @param {MediaDTO[]} media
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
      json.media.map((media) => new MediaDTO(
        media.id,
        media.websiteId,
        media.origFileName,
        media.fileName,
        media.fileSize,
        media.fileType,
        media.thumbName,
        media.timestamp
      ))
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
      media: this.media.map((media) => media.toJSON())
    };
  }
}
