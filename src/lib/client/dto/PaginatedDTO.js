import DTO from './DTO.js';

export default class PaginatedDTO extends DTO {
  #metadata;

  constructor(page, pages) {
    super();
    this.#metadata = Object.freeze({
      page,
      pages
    });
  }

  get _metadata() {
    return this.#metadata;
  }

  toJSON() {
    return {
      _metadata: this._metadata
    };
  }
}
