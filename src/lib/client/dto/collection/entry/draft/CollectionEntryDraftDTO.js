import DTO from '../../../DTO.js';

export default class CollectionEntryDraftDTO extends DTO {
  #id;
  #entryId;
  #collectionId;
  #createdAt;
  #updatedAt;
  #data;

  /**
   * @param {string} id
   * @param {string | null} entryId
   * @param {string} collectionId
   * @param {number} createdAt
   * @param {number} updatedAt
   * @param {Record<string, string>} data
   */
  constructor(id, entryId, collectionId, createdAt, updatedAt, data) {
    super();
    // ID, collection ID, and timestamps are not mutable, so validation is done here
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#collectionId = this.validator(collectionId, 'collectionId').required()
      .string().getValue();
    this.#createdAt = this.validator(createdAt, 'createdAt').required().number().getValue();
    this.#updatedAt = this.validator(updatedAt, 'updatedAt').required().number().getValue();

    this.entryId = entryId;
    this.data = data;
  }

  get id() {
    return this.#id;
  }

  get entryId() {
    return this.#entryId;
  }

  set entryId(entryId) {
    this.#entryId = this.validator(entryId, 'entryId').string().getValue();
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

  get data() {
    return this.#data;
  }

  set data(data) {
    this.#data = this.validator(data, 'data').required().object().getValue();
  }

  clone() {
    return new CollectionEntryDraftDTO(
      this.id,
      this.entryId,
      this.collectionId,
      this.createdAt,
      this.updatedAt,
      this.data
    );
  }

  static fromJSON(json) {
    return new CollectionEntryDraftDTO(
      json.id,
      json.entryId,
      json.collectionId,
      json.createdAt,
      json.updatedAt,
      json.data
    );
  }

  toJSON() {
    return {
      id: this.id,
      entryId: this.entryId,
      collectionId: this.collectionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      data: this.data
    };
  }
}
