/* eslint-disable jsdoc/reject-any-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import DTOValidator from './validator/DTOValidator.js';
import AbstractNotImplementedError from './errors/AstractNotImplementedError.js';

// TODO: Properly type all DTOs with JSDoc
export default class DTO {
  /**
   * Returns a validator instance
   * @template T
   * @param {T} value The value to validate
   * @param {string} name A human readable name
   * @returns {DTOValidator<T>}
   */
  validator(value, name) {
    return new DTOValidator(value, name);
  }

  /**
   * Creates a new DTO from a JSON object
   * @param {object} json JSON object
   * @returns {this}
   * @abstract
   */
  static fromJSON(json) {
    throw new AbstractNotImplementedError();
  }

  /**
   * Returns a JSON object
   * @returns {object}
   * @abstract
   */
  toJSON() {
    throw new AbstractNotImplementedError();
  }

  /**
   * @abstract
   * @returns {this}
   */
  clone() {
    throw new AbstractNotImplementedError();
  }
}
