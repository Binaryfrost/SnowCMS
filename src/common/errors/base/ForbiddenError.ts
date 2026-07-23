import ExpressError from './ExpressError';

export default class ForbiddenError extends ExpressError {
  constructor(message?: string) {
    super(message || 'Forbidden', 403);
  }
}
