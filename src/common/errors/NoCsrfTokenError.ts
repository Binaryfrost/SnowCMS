import BadRequestError from './base/BadRequestError';

export default class NoCsrfTokenError extends BadRequestError {
  constructor() {
    super('No CSRF token provided');
  }
}
