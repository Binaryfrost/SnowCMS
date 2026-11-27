/* eslint-disable jsdoc/reject-any-type */
/* eslint-disable jsdoc/no-undefined-types */
import ValidationError from '../errors/ValidationError.js';
import DTOTypedValidator from './DTOTypedValidator.js';

/**
 * @template [T=any]
 * @extends {DTOTypedValidator<T>}
 */
export default class DTOArrayValidator extends DTOTypedValidator {
  validate() {
    if (this.isNullAndNotRequired()) return;
    if (!Array.isArray(this.getValue())) {
      throw ValidationError.withType(this.getName(), 'array');
    }
  }

  /**
   * Validates that the array has at least `size` elements.
   * @param {number} size
   * @returns {this}
   */
  minSize(size) {
    if (this.isNullAndNotRequired()) return this;

    /** @type {any[]} */
    const array = this.getValue();
    if (array.length < size) {
      throw ValidationError.withMessage(`${this.getName()} must have at least ${size} elements`);
    }

    return this;
  }

  /**
   * Validates that the array has at most `size` elements.
   * @param {number} size
   * @returns {this}
   */
  maxSize(size) {
    if (this.isNullAndNotRequired()) return this;

    /** @type {any[]} */
    const array = this.getValue();
    if (array.length > size) {
      throw ValidationError.withMessage(`${this.getName()} must have at most ${size} elements`);
    }

    return this;
  }

  /**
   * Calls the given function for all elements of the array. You should instantiate
   * a DTOTypedValidator to validate the given element.
   * @param {(elem: Exclude<T, undefined>[number], name) => DTOTypedValidator<T | any>} fn
   * @returns {this}
   * @example (elem, name) => this.validator(elem, name).required().integer()
   */
  of(fn) {
    if (this.isNullAndNotRequired()) return this;

    // eslint-disable-next-line jsdoc/reject-any-type
    /** @type {any[]} */
    const array = this.getValue();
    for (let i = 0; i < array.length; i++) {
      fn(array[i], `${this.getName()}[${i}]`);
    }

    return this;
  }
}
