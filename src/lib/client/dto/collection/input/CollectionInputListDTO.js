import DTO from '../../DTO';

export default class CollectionInputListDTO extends DTO {
  #inputs;

  /**
   * @param {import('./CollectionInput').CollectionInput[]} inputs
   */
  constructor(inputs) {
    super();
    this.#inputs = this.validator(inputs, 'inputs').required().array().getValue();
  }

  get inputs() {
    return this.#inputs;
  }

  clone() {
    return new CollectionInputListDTO(this.#inputs);
  }

  static fromJSON(json) {
    return new CollectionInputListDTO(json.inputs);
  }

  toJSON() {
    return {
      inputs: this.#inputs
    };
  }
}
