import DTO from '../../DTO.js';

/**
 * An input value belonging to a Collection Entry.
 */
export default class CollectionEntryInputDTO extends DTO {
  #entryId;
  #inputId;
  #data;

  /**
   * @param {string | null} entryId
   * @param {string} inputId
   * @param {string} data
   */
  constructor(entryId, inputId, data) {
    super();
    // Entry ID and input ID are not mutable, so validation is done here
    this.#entryId = this.validator(entryId, 'entryId').string().getValue();
    this.#inputId = this.validator(inputId, 'inputId').required().string().getValue();

    this.data = data;
  }

  get entryId() {
    return this.#entryId;
  }

  get inputId() {
    return this.#inputId;
  }

  get data() {
    return this.#data;
  }

  set data(data) {
    this.#data = this.validator(data, 'data').string().getValue();
  }

  clone() {
    return new CollectionEntryInputDTO(this.entryId, this.inputId, this.data);
  }

  static fromJSON(json) {
    return new CollectionEntryInputDTO(json.entryId, json.inputId, json.data);
  }

  toJSON() {
    return {
      entryId: this.entryId,
      inputId: this.inputId,
      data: this.data
    };
  }
}
