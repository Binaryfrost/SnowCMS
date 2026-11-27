/* eslint-disable jsdoc/reject-any-type */
import DTO from '../../DTO.js';

export default class CollectionInputDTO extends DTO {
  #id;
  #collectionId;
  #input;
  #name;
  #fieldName;
  #description;
  #required;
  #inputConfig;

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {string} input
   * @param {string} name
   * @param {string} fieldName
   * @param {string} description
   * @param {boolean} required
   * @param {Record<string, any>} inputConfig
   */
  constructor(
    id,
    collectionId,
    input,
    name,
    fieldName,
    description,
    required,
    inputConfig
  ) {
    super();
    // ID, collection ID, and input are not mutable, so validation is done here
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#collectionId = this.validator(collectionId, 'collectionId').required()
      .string().getValue();
    this.#input = this.validator(input, 'input').required().string().getValue();

    this.name = name;
    this.fieldName = fieldName;
    this.description = description;
    this.required = required;
    this.inputConfig = inputConfig;
  }

  get id() {
    return this.#id;
  }

  get collectionId() {
    return this.#collectionId;
  }

  get input() {
    return this.#input;
  }

  get name() {
    return this.#name;
  }

  set name(name) {
    this.#name = this.validator(name, 'name').required().string().getValue();
  }

  get fieldName() {
    return this.#fieldName;
  }

  set fieldName(fieldName) {
    this.#fieldName = this.validator(fieldName, 'fieldName').required().string().getValue();
  }

  get description() {
    return this.#description;
  }

  set description(description) {
    this.#description = this.validator(description, 'description').string().getValue();
  }

  get required() {
    return this.#required;
  }

  set required(required) {
    this.#required = this.validator(required, 'required').required().boolean().getValue();
  }

  get inputConfig() {
    return this.#inputConfig;
  }

  set inputConfig(inputConfig) {
    this.#inputConfig = this.validator(inputConfig, 'inputConfig').required()
      .object().getValue();
  }

  clone() {
    return new CollectionInputDTO(
      this.id,
      this.collectionId,
      this.input,
      this.name,
      this.fieldName,
      this.description,
      this.required,
      this.inputConfig
    );
  }

  static fromJSON(json) {
    return new CollectionInputDTO(
      json.id,
      json.collectionId,
      json.input,
      json.name,
      json.fieldName,
      json.description,
      json.required,
      json.inputConfig
    );
  }

  toJSON() {
    return {
      id: this.id,
      collectionId: this.collectionId,
      input: this.input,
      name: this.name,
      fieldName: this.fieldName,
      description: this.description,
      required: this.required,
      inputConfig: this.inputConfig
    };
  }
}
