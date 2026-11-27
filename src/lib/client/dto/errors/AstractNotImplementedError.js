export default class AbstractNotImplementedError extends Error {
  constructor() {
    super('Method must be implemented by subclass');
  }
}
