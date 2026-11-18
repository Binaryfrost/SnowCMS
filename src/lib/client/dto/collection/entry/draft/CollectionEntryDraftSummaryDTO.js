import DTO from '../../../DTO.js';

export default class CollectionEntryDraftSummaryDTO extends DTO {
  #id;
  #entryId;
  #collectionId;
  #createdAt;
  #updatedAt;
  #title;

  /**
   * @param {string} id
   * @param {string | null} entryId
   * @param {string} collectionId
   * @param {number} createdAt
   * @param {number} updatedAt
   * @param {string | null} title
   */
  constructor(id, entryId, collectionId, createdAt, updatedAt, title) {
    super();
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#entryId = this.validator(entryId, 'entryId').string().getValue();
    this.#collectionId = this.validator(collectionId, 'collectionId').required().string().getValue();
    this.#createdAt = this.validator(createdAt, 'createdAt').required().number().getValue();
    this.#updatedAt = this.validator(updatedAt, 'updatedAt').required().number().getValue();
    this.#title = this.validator(title, 'title').string().getValue();
  }

  get id() {
    return this.#id;
  }

  get entryId() {
    return this.#entryId;
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

  get title() {
    return this.#title;
  }

  clone() {
    return new CollectionEntryDraftSummaryDTO(
      this.id,
      this.entryId,
      this.collectionId,
      this.createdAt,
      this.updatedAt,
      this.title
    );
  }

  static fromJSON(json) {
    return new CollectionEntryDraftSummaryDTO(
      json.id,
      json.entryId,
      json.collectionId,
      json.createdAt,
      json.updatedAt,
      json.title
    );
  }

  toJSON() {
    return {
      id: this.id,
      entryId: this.entryId,
      collectionId: this.collectionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      title: this.title
    };
  }
}
