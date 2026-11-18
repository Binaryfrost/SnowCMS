import CollectionEntryDTO from './CollectionEntryDTO.js';

export default class CollectionEntryWithMetadataDTO extends CollectionEntryDTO {
  #title;
  #slug;

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {number} createdAt
   * @param {number} updatedAt
   * @param {string | null} title
   * @param {string | null} slug
   */
  constructor(id, collectionId, createdAt, updatedAt, title, slug) {
    super(id, collectionId, createdAt, updatedAt);
    this.#title = this.validator(title, 'title').string().getValue();
    this.#slug = this.validator(slug, 'slug').string().getValue();
  }

  get title() {
    return this.#title;
  }

  get slug() {
    return this.#slug;
  }

  clone() {
    return new CollectionEntryWithMetadataDTO(
      this.id,
      this.collectionId,
      this.createdAt,
      this.updatedAt,
      this.title,
      this.slug
    );
  }

  static fromJSON(json) {
    return new CollectionEntryWithMetadataDTO(
      json.id,
      json.collectionId,
      json.createdAt,
      json.updatedAt,
      json.title,
      json.slug
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      slug: this.slug
    };
  }
}
