import ValidationError from '../errors/ValidationError.js';
/* eslint-disable jsdoc/reject-any-type */
import DTOTypedValidator from './DTOTypedValidator.js';

/** @extends {DTOTypedValidator<any>} */
export default class DTOEnumValidator extends DTOTypedValidator {
  #enum;
  #name;

  /**
   * @param {import('./DTOValidator').default} validator
   * @param {import('typescript').EnumType | Record<any, any>} enumObj
   * @param {string} name
   */
  constructor(validator, enumObj, name) {
    super(validator);
    this.#enum = enumObj;
    this.#name = name;

    this.validate();
  }

  validate() {
    // We need to skip the superclass' validation so we can initialize these values first
    if (!this.#enum) return;
    if (this.isNullAndNotRequired()) return;
    if (!(this.getValue() in this.#enum)) {
      throw ValidationError.withType(`enum ${this.#name}`);
    }
  }
}
