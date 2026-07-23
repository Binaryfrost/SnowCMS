import ValidationError from '../errors/ValidationError';
import DTOTypedValidator from './DTOTypedValidator';

export default class DTOUnionValidator extends DTOTypedValidator {
  #consts;

  /**
   * @param {import('./DTOValidator').default} validator
   * @param {import('utility-types').Primitive[]} consts
   */
  constructor(validator, consts) {
    super(validator);
    this.#consts = consts;
  }

  validate() {
    // We need to skip the superclass' validation so we can initialize this value first
    if (!this.#consts) return;
    if (this.isNullAndNotRequired()) return;

    const value = this.getValue();
    if (!this.#consts.includes(value)) {
      throw ValidationError.withType(`union ${this.#consts.join(' | ')}`);
    }
  }
}
