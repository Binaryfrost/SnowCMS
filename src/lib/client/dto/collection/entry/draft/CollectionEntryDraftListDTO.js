import PaginatedDTO from '../../../PaginatedDTO.js';
import CollectionEntryDraftSummaryDTO from './CollectionEntryDraftSummaryDTO.js';

export default class CollectionEntryDraftListDTO extends PaginatedDTO {
  #drafts;

  /**
   * @param {number} page
   * @param {number} pages
   * @param {CollectionEntryDraftSummaryDTO[]} drafts
   */
  constructor(page, pages, drafts) {
    super(page, pages);
    this.#drafts = this.validator(drafts, 'drafts').required().array().getValue();
  }

  get drafts() {
    return this.#drafts;
  }

  clone() {
    return new CollectionEntryDraftListDTO(
      this._metadata.page,
      this._metadata.pages,
      this.drafts
    );
  }

  static fromJSON(json) {
    return new CollectionEntryDraftListDTO(
      json._metadata.page,
      json._metadata.pages,
      json.drafts.map((draft) => CollectionEntryDraftSummaryDTO.fromJSON(draft))
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      drafts: this.drafts.map((draft) => draft.toJSON())
    };
  }
}
