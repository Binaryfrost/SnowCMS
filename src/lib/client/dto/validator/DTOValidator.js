/* eslint-disable jsdoc/reject-any-type */

import ValidationError from '../errors/ValidationError.js';
import DTOArrayValidator from './DTOArrayValidator.js';
import DTOBooleanValidator from './DTOBooleanValidator.js';
import DTOUnionValidator from './DTOUnionValidator.js';
import DTOEnumValidator from './DTOEnumValidator.js';
import DTOErrorValidator from './DTOErrorValidator.js';
import DTOIntegerValidator from './DTOIntegerValidator.js';
import DTONoopValidator from './DTONoopValidator.js';
import DTONumberValidator from './DTONumberValidator.js';
import DTOObjectValidator from './DTOObjectValidator.js';
import DTOStringValidator from './DTOStringValidator.js';

/**
 * DTOValidator is a helper class for data validation. If a validation error
 * occurs, {@link ValidationError} is thrown.
 * @template T
 */
export default class DTOValidator {
  /** @type {boolean} */
  #required = false;
  #value;
  #name;

  /**
   * @param {T} value Value
   * @param {string} name Name used in error messages
   */
  constructor(value, name) {
    this.#value = value;
    this.#name = name;
  }

  getName() {
    return this.#name;
  }

  getValue() {
    return this.#value;
  }

  /**
   * Sets the value as being required. Must be called before other methods.
   * @returns {this}
   */
  required() {
    this.#required = true;
    return this;
  }

  isRequired() {
    return this.#required;
  }

  /**
   * Validates the value as a string
   * @returns {DTOStringValidator}
   */
  string() {
    return new DTOStringValidator(this);
  }

  /**
   * Validates the value as a number
   * @returns {DTONumberValidator}
   */
  number() {
    return new DTONumberValidator(this);
  }

  /**
   * Validates the value as an integer
   * @returns {DTOIntegerValidator}
   */
  integer() {
    return new DTOIntegerValidator(this);
  }

  /**
   * Validates the value as a boolean
   * @returns {DTOBooleanValidator}
   */
  boolean() {
    return new DTOBooleanValidator(this);
  }

  /**
   * Validates the value as an array
   * @returns {DTOArrayValidator<T>}
   */
  array() {
    return new DTOArrayValidator(this);
  }

  /**
   * Validates the value as an object
   * @returns {DTOObjectValidator<T>}
   */
  object() {
    return new DTOObjectValidator(this);
  }

  /**
   * Validates the value as an enum member
   * @param {import('typescript').EnumType | Record<any, any>} e Enum
   * @param {string} name Name of enum
   * @returns {DTOEnumValidator}
   */
  enum(e, name) {
    return new DTOEnumValidator(this, e, name);
  }

  /**
   * A special validator that always throws an error. Useful for
   * implementing custom validation code for unsupported types.
   * @param {string} type Expected data type
   */
  error(type) {
    return new DTOErrorValidator(this, type);
  }

  /**
   * A special validator that never throws an error. Useful for
   * implementing custom validation code for unsupported types.
   */
  noop() {
    return new DTONoopValidator(this);
  }

  /**
   * Validates that the value is part of the union.
   * @param {T[]} union
   * @returns {DTOUnionValidator<T>}
   */
  union(union) {
    return new DTOUnionValidator(this, union);
  }
}
