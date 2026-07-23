import DTO from '../DTO';

export default class ConfirmMediaUploadDTO extends DTO {
  #id;
  #data;
  #hmac;

  /**
   * @param {string} id
   * @param {import('./Media').FileUploadConfirmationData} data
   * @param {string} hmac
   */
  constructor(id, data, hmac) {
    super();
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#hmac = this.validator(hmac, 'hmac').required().string().getValue();
    this.#data = this.validator(data, 'data').required().object().of({
      image: (value, name) => this.validator(value, name)
        .required().object().of({
          name: (v, n) => this.validator(v, n).required().string(),
          s3Name: (v, n) => this.validator(v, n).required().string(),
          size: (v, n) => this.validator(v, n).required().number(),
          type: (v, n) => this.validator(v, n).required().string()
        }),
      thumbnail: (value, name) => this.validator(value, name)
        .required().object().of({
          s3Name: (v, n) => this.validator(v, n).required().string()
        })
    })
      .getValue();
  }

  get id() {
    return this.#id;
  }

  get hmac() {
    return this.#hmac;
  }

  get data() {
    return this.#data;
  }

  clone() {
    return new ConfirmMediaUploadDTO(
      this.id,
      this.data,
      this.hmac
    );
  }

  static fromJSON(json) {
    return new ConfirmMediaUploadDTO(
      json.id,
      json.data,
      json.hmac
    );
  }

  toJSON() {
    return {
      id: this.id,
      hmac: this.hmac,
      data: this.data
    };
  }
}
