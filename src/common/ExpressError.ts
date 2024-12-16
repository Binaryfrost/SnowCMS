/**
 * An error that returns HTTP code 400 by default
 */
export default class ExpressError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
  }
}
