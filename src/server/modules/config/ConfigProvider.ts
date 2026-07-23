import DTOValidator from '../../../lib/client/dto/validator/DTOValidator';
import MvcObject from '../MvcObject';

export default class ConfigProvider extends MvcObject {
  private validatorNameRoot: string | undefined;

  constructor(validatorNameRoot?: string) {
    super();
    this.validatorNameRoot = validatorNameRoot;
  }

  validator<T>(value: T, name: string) {
    return new DTOValidator<T>(value, this.getFullName(name));
  }

  private getFullName(name: string) {
    if (!this.validatorNameRoot) return name;
    return `${this.validatorNameRoot}.${name}`;
  }
}
