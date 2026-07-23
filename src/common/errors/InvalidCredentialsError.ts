import UnauthorizedError from './base/UnauthorizedError';

export default class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Username or password incorrect');
  }
}
