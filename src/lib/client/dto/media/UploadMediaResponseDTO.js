import DTO from '../DTO';

export default class UploadMediaResponseDTO extends DTO {
  #id;
  #image;
  #thumbnail;
  #hmac;

  /**
   * @param {string} id
   * @param {import('./Media').S3PreSignedUrl} image
   * @param {import('./Media').S3PreSignedUrl | null} thumbnail
   * @param {string} hmac
   */
  constructor(id, image, thumbnail, hmac) {
    super();

    const presignedUrlShape = {
      name: (v, n) => this.validator(v, n).required().string(),
      url: (v, n) => this.validator(v, n).required().string()
    };

    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#image = this.validator(image, 'image').required().object()
      .of(presignedUrlShape)
      .getValue();
    this.#thumbnail = this.validator(thumbnail, 'thumbnail').object()
      .of(presignedUrlShape)
      .getValue();
    this.#hmac = this.validator(hmac, 'hmac').required().string().getValue();
  }

  get id() {
    return this.#id;
  }

  get image() {
    return this.#image;
  }

  get thumbnail() {
    return this.#thumbnail;
  }

  get hmac() {
    return this.#hmac;
  }

  clone() {
    return new UploadMediaResponseDTO(
      this.id,
      this.image,
      this.thumbnail,
      this.hmac
    );
  }

  static fromJSON(json) {
    return new UploadMediaResponseDTO(
      json.id,
      json.image,
      json.thumbnail,
      json.hmac
    );
  }

  toJSON() {
    return {
      id: this.id,
      image: this.image,
      thumbnail: this.thumbnail,
      hmac: this.hmac
    };
  }
}
