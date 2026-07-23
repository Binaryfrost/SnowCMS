import DTO from '../DTO';

export default class UploadMediaDTO extends DTO {
  #name;
  #size;
  #type;
  #thumbnail;

  /**
   * @param {string} name File name
   * @param {number} size File size
   * @param {string} type File mime type
   * @param {import('./Media').CommonFileMetadata | null} thumbnail Thumbnail
   */
  constructor(name, size, type, thumbnail) {
    super();
    this.#name = name;
    this.#size = this.validator(size, 'size').required().number().getValue();
    this.#type = this.validator(type, 'type').required().string().getValue();
    this.#thumbnail = this.validator(thumbnail, 'thumbnail').object().of({
      name: (v, n) => this.validator(v, n)
        .required().string(),
      size: (v, n) => this.validator(v, n)
        .required().number().getValue(),
      type: (v, n) => this.validator(v, n)
        .required().string().getValue(),
    }).getValue();
  }

  get name() {
    return this.#name;
  }

  get size() {
    return this.#size;
  }

  get type() {
    return this.#type;
  }

  get thumbnail() {
    return this.#thumbnail;
  }

  clone() {
    return new UploadMediaDTO(
      this.name,
      this.size,
      this.type,
      this.thumbnail
    );
  }

  static fromJSON(json) {
    return new UploadMediaDTO(
      json.name,
      json.size,
      json.type,
      json.thumbnail
    );
  }
}
