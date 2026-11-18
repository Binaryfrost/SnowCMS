import DTO from '../../DTO.js';

export default class CollectionInputListDTO extends DTO {
  #inputs;

  /**
   * @param {import('./CollectionInputDTO').default[]} inputs
   */
  constructor(inputs) {
    super();
    this.#inputs = this.validator(inputs, 'inputs').required().array().getValue();
  }

  get inputs() {
    return this.#inputs;
  }

  clone() {
    return new CollectionInputListDTO(this.#inputs.map((input) => input.clone()));
  }

  static fromJSON(json) {
    return new CollectionInputListDTO(json.inputs);
  }

  toJSON() {
    return {
      inputs: this.#inputs.map((input) => input.toJSON())
    };
  }
}
