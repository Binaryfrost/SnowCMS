import DTO from '../../../DTO.js';

export default class CreateUpdateCollectionEntryDraftDTO extends DTO {
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
    return new CreateUpdateCollectionEntryDraftDTO(this.data);
  }

  static fromJSON(json) {
    return new CreateUpdateCollectionEntryDraftDTO(json.data);
  }

  toJSON() {
    return {
      data: this.data
    };
  }
}
