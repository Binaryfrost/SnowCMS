import ExpressError from './ExpressError';

export default class NotFoundError extends ExpressError {
  constructor(message?: string) {
    super(message || 'Not Found', 404);
  }
}
