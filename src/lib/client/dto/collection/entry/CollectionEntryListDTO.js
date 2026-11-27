import PaginatedDTO from '../../PaginatedDTO.js';
import CollectionEntryWithMetadataDTO from './CollectionEntryWithMetadataDTO.js';

export default class CollectionEntryListDTO extends PaginatedDTO {
  #entries;

  /**
   * @param {number} page
   * @param {number} pages
   * @param {CollectionEntryWithMetadataDTO[]} entries
   */
  constructor(page, pages, entries) {
    super(page, pages);
    this.#entries = this.validator(entries, 'entries').required().array().getValue();
  }

  get entries() {
    return this.#entries;
  }

  clone() {
    return new CollectionEntryListDTO(
      this._metadata.page,
      this._metadata.pages,
      this.entries
    );
  }

  static fromJSON(json) {
    return new CollectionEntryListDTO(
      json._metadata.page,
      json._metadata.pages,
      json.entries.map((entry) => CollectionEntryWithMetadataDTO.fromJSON(entry))
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      entries: this.entries.map((entry) => entry.toJSON())
    };
  }
}
