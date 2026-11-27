import ValidationError from '../errors/ValidationError.js';
import DTOTypedValidator from './DTOTypedValidator.js';

/** @extends {DTOTypedValidator<string>} */
export default class DTOStringValidator extends DTOTypedValidator {
  validate() {
    if (this.isNullAndNotRequired()) return;
    if (typeof this.getValue() !== 'string') {
      throw ValidationError.withType(this.getValue(), 'string');
    }
  }

  /**
   * Validates that a value is at least `length` characters.
   * @param {number} length
   * @returns {this}
   */
  minLength(length) {
    if (this.isNullAndNotRequired()) return this;
    if (this.getValue().length < length) {
      throw ValidationError.withMessage(`${this.getName()} must be at least ${length} characters`);
    }
    return this;
  }

  /**
   * Validates that a value is at most `length` characters.
   * @param {number} length
   * @returns {this}
   */
  maxLength(length) {
    if (this.isNullAndNotRequired()) return this;
    if (this.getValue().length > length) {
      throw ValidationError.withMessage(`${this.name} must be at most ${length} characters`);
    }
    return this;
  }
}
