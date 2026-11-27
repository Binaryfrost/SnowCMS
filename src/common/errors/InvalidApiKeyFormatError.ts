import BadRequestError from './base/BadRequestError';

export default class InvalidApiKeyFormatError extends BadRequestError {
  constructor() {
    super('Invalid API key format');
  }
}
