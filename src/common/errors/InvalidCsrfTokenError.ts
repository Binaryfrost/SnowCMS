import BadRequestError from './base/BadRequestError';

export default class InvalidCsrfTokenError extends BadRequestError {
  constructor() {
    super('Invalid CSRF token');
  }
}
