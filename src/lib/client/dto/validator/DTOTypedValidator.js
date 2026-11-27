/**
 * @template T
 */
export default class DTOTypedValidator {
  #required;
  #value;
  #name;

  /** @param {import('./DTOValidator').default} validator */
  constructor(validator) {
    this.#required = validator.isRequired();
    this.#value = validator.getValue();
    this.#name = validator.getName();

    this.validate();
  }

  getName() {
    return this.#name;
  }

  // TODO: Figure out way to add null to type if not required
  /** @returns {T} */
  getValue() {
    return this.#value;
  }

  isRequired() {
    return this.#required;
  }

  isNullAndNotRequired() {
    return !this.isRequired() && (this.getValue() === null || this.getValue() === undefined);
  }

  /** @abstract */
  validate() {}
}
