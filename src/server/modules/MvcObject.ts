import Logger from '../../common/Logger';

export default class MvcObject {
  private logger!: Logger;

  protected getLogger() {
    if (!this.logger) {
      // TODO: Test that Webpack does not mess with name. Should return subclass name.
      this.logger = new Logger(this.constructor.name);
    }

    return this.logger;
  }
}
