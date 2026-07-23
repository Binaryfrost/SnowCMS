import DTOTypedValidator from './DTOTypedValidator';

/** @extends {DTOTypedValidator<number>} */
export default class DTONumberValidator extends DTOTypedValidator {
  validate() {
    if (this.isNullAndNotRequired()) return;
    if (typeof this.getValue() !== 'number') {
      throw ValidationError.withType(this.getName(), 'number');
    }
  }

  /**
   * Validates that the number is at least `min`.
   * @param {number} min
   * @returns {this}
   */
  min(min) {
    if (this.isNullAndNotRequired()) return this;
    if (this.getValue() < min) {
      throw ValidationError.withMessage(`${this.getName()} must be at least ${min}`);
    }
    return this;
  }

  /**
   * Validates that the number is at least `max`.
   * @param {number} max
   * @returns {this}
   */
  max(max) {
    if (this.isNullAndNotRequired()) return this;
    if (this.getValue() > max) {
      throw ValidationError.withMessage(`${this.getName()} must be at most ${max}`);
    }
    return this;
  }
}
