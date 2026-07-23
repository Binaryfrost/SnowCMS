import ValidationError from '../errors/ValidationError';
import DTOTypedValidator from './DTOTypedValidator';

/** @extends {DTOTypedValidator<boolean>} */
export default class DTOBooleanValidator extends DTOTypedValidator {
  validate() {
    if (this.isNullAndNotRequired()) return;
    if (typeof this.getValue() !== 'boolean') {
      throw ValidationError.withType(this.getName(), 'boolean');
    }
  }

  true() {
    if (this.isNullAndNotRequired()) return this;

    if (this.getValue() !== true) {
      throw ValidationError.withMessage(`${this.getName()} must be true`);
    }

    return this;
  }

  false() {
    if (this.isNullAndNotRequired()) return this;

    if (this.getValue() !== false) {
      throw ValidationError.withMessage(`${this.getName()} must be false`);
    }

    return this;
  }
}
