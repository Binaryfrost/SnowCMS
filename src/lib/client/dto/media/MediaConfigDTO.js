import DTO from '../DTO.js';

export default class MediaConfigDTO extends DTO {
  #maxSize;
  #maxStorage;
  #usedStorage;

  /**
   * @param {number} maxSize
   * @param {number} maxStorage
   * @param {number} usedStorage
   */
  constructor(maxSize, maxStorage, usedStorage) {
    super();
    this.#maxSize = this.validator(maxSize, 'maxSize').required().number().getValue();
    this.#maxStorage = this.validator(maxStorage, 'maxStorage').required().number().getValue();
    this.#usedStorage = this.validator(usedStorage, 'usedStorage').required().number().getValue();
  }

  get maxSize() {
    return this.#maxSize;
  }

  get maxStorage() {
    return this.#maxStorage;
  }

  get usedStorage() {
    return this.#usedStorage;
  }

  clone() {
    return new MediaConfigDTO(this.maxSize, this.maxStorage, this.usedStorage);
  }

  static fromJSON(json) {
    return new MediaConfigDTO(json.maxSize, json.maxStorage, json.usedStorage);
  }

  toJSON() {
    return {
      maxSize: this.maxSize,
      maxStorage: this.maxStorage,
      usedStorage: this.usedStorage
    };
  }
}
