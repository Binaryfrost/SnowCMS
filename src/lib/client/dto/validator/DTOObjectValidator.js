/* eslint-disable jsdoc/reject-any-type */
/* eslint-disable jsdoc/no-undefined-types */
import ValidationError from '../errors/ValidationError.js';
import DTOTypedValidator from './DTOTypedValidator.js';

/**
 * @template [T=Record<string, any>]
 * @extends {DTOTypedValidator<T>}
 */
export default class DTOObjectValidator extends DTOTypedValidator {
  validate() {
    if (this.isNullAndNotRequired()) return;
    if (this.getValue() === null || typeof this.getValue() !== 'object' ||
      Array.isArray(this.getValue())) {
      throw ValidationError.withType(this.getName(), 'object');
    }
  }

  /**
   * @typedef {{ [K in keyof T]: (value: Exclude<T[K], undefined>, name: string) => DTOTypedValidator }} ValidationShape
   */

  /**
   * @param {ValidationShape} shape
   * @returns {this}
   * @example
   * {
   *  name: (value, name) => this.validator(value, name).required().string(),
   *  active: (value, name) => this.validator(value, name).required().boolean(),
   *  data: (value, name) => this.validator(value, name).required().object().of({...})
   * }
   */
  of(shape) {
    if (this.isNullAndNotRequired()) return this;

    /** @type {Record<string, any>} */
    const obj = this.getValue();
    const objKeys = Object.keys(obj);
    /** @type {[string, ValidationShape[keyof ValidationShape]][]} */
    const shapeArray = Object.entries(shape);

    const unknownKey = objKeys.find((key) => !(key in shape));
    if (unknownKey) {
      throw ValidationError.withMessage(`${this.getName()} has unknown key ${unknownKey}`);
    }

    for (let i = 0; i < shapeArray.length; i++) {
      const [key, fn] = shapeArray[i];
      fn(obj[key], `${this.getName()}.${key}`);
    }

    return this;
  }
}
