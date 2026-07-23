/* eslint-disable jsdoc/reject-any-type */
import DTO from '../../DTO';

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
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#collectionId = this.validator(collectionId, 'collectionId').required().string().getValue();
    this.#input = this.validator(input, 'input').required().string().getValue();
    this.#name = this.validator(name, 'name').required().string().getValue();
    this.#fieldName = this.validator(fieldName, 'fieldName').required().string().getValue();
    this.#description = this.validator(description, 'description').required().string().getValue();
    this.#required = this.validator(required, 'required').required().boolean().getValue();
    this.#inputConfig = this.validator(inputConfig, 'inputConfig').required().object().getValue();
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

  get fieldName() {
    return this.#fieldName;
  }

  get description() {
    return this.#description;
  }

  get required() {
    return this.#required;
  }

  get inputConfig() {
    return this.#inputConfig;
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
