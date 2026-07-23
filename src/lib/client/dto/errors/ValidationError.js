export default class ValidationError extends Error {
  /**
   * Returns an error with a custom message. You should include the name yourself.
   * @param {string} message Error message
   * @returns {ValidationError}
   */
  static withMessage(message) {
    return new ValidationError(message);
  }

  /**
   * Returns an error with preset message for an unmatched type
   * @param {string} name Name
   * @param {string} type Required value type
   * @returns {ValidationError}
   */
  static withType(name, type) {
    return new ValidationError(`Provided value for ${name} does not match type ${type}`);
  }
}
