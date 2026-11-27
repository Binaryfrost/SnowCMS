import DTO from '../../DTO.js';

export default class CollectionEntryDTO extends DTO {
  #id;
  #collectionId;
  #createdAt;
  #updatedAt;

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {number} createdAt
   * @param {number} updatedAt
   */
  constructor(id, collectionId, createdAt, updatedAt) {
    super();
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#collectionId = this.validator(collectionId, 'collectionId').required().string().getValue();
    this.#createdAt = this.validator(createdAt, 'createdAt').required().number().getValue();
    this.#updatedAt = this.validator(updatedAt, 'updatedAt').required().number().getValue();
  }

  get id() {
    return this.#id;
  }

  get collectionId() {
    return this.#collectionId;
  }

  get createdAt() {
    return this.#createdAt;
  }

  get updatedAt() {
    return this.#updatedAt;
  }

  clone() {
    return new CollectionEntryDTO(this.id, this.collectionId, this.createdAt, this.updatedAt);
  }

  static fromJSON(json) {
    return new CollectionEntryDTO(
      json.id,
      json.collectionId,
      json.createdAt,
      json.updatedAt
    );
  }

  toJSON() {
    return {
      id: this.id,
      collectionId: this.collectionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
