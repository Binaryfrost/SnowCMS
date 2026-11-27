import BadRequestError from './base/BadRequestError';

export default class NoCsrfCookieError extends BadRequestError {
  constructor() {
    super('No CSRF cookie in request');
  }
}
