import BadRequestError from './base/BadRequestError';

export default class InvalidHmacError extends BadRequestError {
  constructor() {
    super('Invalid HMAC');
  }
}
