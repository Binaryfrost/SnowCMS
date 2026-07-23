import PaginatedDTO from '../PaginatedDTO';
import CollectionDTO from './CollectionDTO';

export default class CollectionListDTO extends PaginatedDTO {
  #collections;

  /**
   * @param {number} page
   * @param {number} pages
   * @param {CollectionDTO[]} collections
   */
  constructor(page, pages, collections) {
    super(page, pages);
    this.#collections = this.validator(collections, 'collections').required().array().getValue();
  }

  get collections() {
    return this.#collections;
  }

  clone() {
    return new CollectionListDTO(
      this._metadata.page,
      this._metadata.pages,
      this.collections
    );
  }

  static fromJSON(json) {
    return new CollectionListDTO(
      json._metadata.page,
      json._metadata.pages,
      json.collections
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      collections: this.collections.map((collection) => collection.toJSON())
    };
  }
}
