import ValidationError from '../errors/ValidationError';
import DTOTypedValidator from './DTOTypedValidator';

export default class DTOErrorValidator extends DTOTypedValidator {
  #type;

  /**
   * @param {import('./DTOValidator').default} validator
   * @param {string} type
   */
  constructor(validator, type) {
    super(validator);
    this.#type = type;

    this.validate();
  }

  validate() {
    // We need to skip the superclass' validation so we can initialize this value first
    if (!this.#type) return;
    throw ValidationError.withType(this.getName(), this.#type);
  }
}
