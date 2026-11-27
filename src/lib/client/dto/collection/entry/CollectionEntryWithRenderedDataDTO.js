import CollectionEntryDTO from './CollectionEntryDTO.js';

export default class CollectionEntryWithRenderedDataDTO extends CollectionEntryDTO {
  #data;

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {number} createdAt
   * @param {number} updatedAt
   * @param {Record<string, any>} data
   */
  constructor(id, collectionId, createdAt, updatedAt, data) {
    super(id, collectionId, createdAt, updatedAt);
    this.#data = this.validator(data, 'data').required().object().getValue();
  }

  get data() {
    return this.#data;
  }

  clone() {
    return new CollectionEntryWithRenderedDataDTO(
      this.id,
      this.collectionId,
      this.createdAt,
      this.updatedAt,
      this.data
    );
  }

  static fromJSON(json) {
    return new CollectionEntryWithRenderedDataDTO(
      json.id,
      json.collectionId,
      json.createdAt,
      json.updatedAt,
      json.data
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      data: this.data
    };
  }
}
