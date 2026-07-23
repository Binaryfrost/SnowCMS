import ExpressError from './ExpressError';

export default class InternalServerError extends ExpressError {
  constructor(message?: string) {
    super(message || 'Internal Server Error', 500);
  }
}
