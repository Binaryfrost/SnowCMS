import ExpressError from './ExpressError';

export default class UnauthorizedError extends ExpressError {
  constructor(message?: string) {
    super(message || 'Unauthorized', 401);
  }
}
