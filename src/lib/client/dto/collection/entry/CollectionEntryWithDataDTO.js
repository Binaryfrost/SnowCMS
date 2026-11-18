import CollectionEntryDTO from './CollectionEntryDTO.js';
import CollectionEntryInputDTO from './CollectionEntryInputDTO.js';

export default class CollectionEntryWithDataDTO extends CollectionEntryDTO {
  #data;

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {number} createdAt
   * @param {number} updatedAt
   * @param {CollectionEntryInputDTO[]} data
   */
  constructor(id, collectionId, createdAt, updatedAt, data) {
    super(id, collectionId, createdAt, updatedAt);
    this.#data = this.validator(data, 'data').required().array().getValue();
  }

  get data() {
    return this.#data;
  }

  clone() {
    return new CollectionEntryWithDataDTO(
      this.id,
      this.collectionId,
      this.createdAt,
      this.updatedAt,
      this.data
    );
  }

  static fromJSON(json) {
    return new CollectionEntryWithDataDTO(
      json.id,
      json.collectionId,
      json.createdAt,
      json.updatedAt,
      json.data.map((input) => CollectionEntryInputDTO.fromJSON(input))
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      data: this.data.map((input) => input.toJSON())
    };
  }
}
