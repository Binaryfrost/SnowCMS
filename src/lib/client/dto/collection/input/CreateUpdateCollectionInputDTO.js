import DTO from '../../DTO.js';

export default class CreateUpdateCollectionInputDTO extends DTO {
  #name;
  #description;
  #fieldName;
  #input;
  #inputConfig;
  #required;

  /**
   * @param {string} name
   * @param {string} description
   * @param {string} fieldName
   * @param {string} input
   * @param {Record<string, any>} inputConfig
   * @param {boolean} required
   */
  constructor(
    name,
    description,
    fieldName,
    input,
    inputConfig,
    required
  ) {
    super();
    this.name = name;
    this.description = description;
    this.fieldName = fieldName;
    this.input = input;
    this.inputConfig = inputConfig;
    this.required = required;
  }

  get name() {
    return this.#name;
  }

  set name(name) {
    this.#name = this.validator(name, 'name').required().string().getValue();
  }

  get description() {
    return this.#description;
  }

  set description(description) {
    this.#description = this.validator(description, 'description').string().getValue();
  }

  get fieldName() {
    return this.#fieldName;
  }

  set fieldName(fieldName) {
    this.#fieldName = this.validator(fieldName, 'fieldName').required().string().getValue();
  }

  get input() {
    return this.#input;
  }

  set input(input) {
    this.#input = this.validator(input, 'input').required().string().getValue();
  }

  get inputConfig() {
    return this.#inputConfig;
  }

  set inputConfig(inputConfig) {
    this.#inputConfig = this.validator(inputConfig, 'inputConfig').required()
      .object().getValue();
  }

  get required() {
    return this.#required;
  }

  set required(required) {
    this.#required = this.validator(required, 'required').required().boolean().getValue();
  }

  clone() {
    return new CreateUpdateCollectionInputDTO(
      this.name,
      this.description,
      this.fieldName,
      this.input,
      this.inputConfig,
      this.required
    );
  }

  static fromJSON(json) {
    return new CreateUpdateCollectionInputDTO(
      json.name,
      json.description,
      json.fieldName,
      json.input,
      json.inputConfig,
      json.required
    );
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      fieldName: this.fieldName,
      input: this.input,
      inputConfig: this.inputConfig,
      required: this.required
    };
  }
}
