import DTO from '../../DTO.js';

export default class CreateUpdateCollectionEntryDTO extends DTO {
  #data;

  /**
   * @param {Record<string, string>} data Input values, keyed by field name
   */
  constructor(data) {
    super();
    this.data = data;
  }

  get data() {
    return this.#data;
  }

  set data(data) {
    this.#data = this.validator(data, 'data').required().object().getValue();
  }

  clone() {
    return new CreateUpdateCollectionEntryDTO(this.data);
  }

  static fromJSON(json) {
    return new CreateUpdateCollectionEntryDTO(json.data);
  }

  toJSON() {
    return {
      data: this.data
    };
  }
}
