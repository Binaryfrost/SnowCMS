import ExpressError from './ExpressError';

export default class NotImplementedError extends ExpressError {
  constructor(message?: string) {
    super(message || 'Not Implemented', 501);
  }
}
