import Model from '../Model';

export default class WebsiteModel extends Model {
  private id: string;
  private name: string;
  private hook: string;

  constructor(id: string, name: string, hook?: string) {
    super();
    this.id = id;
    this.name = name;
    this.hook = hook;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  setName(name: string) {
    this.name = name;
  }

  getHook() {
    return this.hook;
  }

  setHook(hook: string) {
    this.hook = hook;
  }
}
