import ExpressError from './ExpressError';

export default class TooManyRequestsError extends ExpressError {
  constructor(message?: string) {
    super(message || 'Too Many Requests', 429);
  }
}
