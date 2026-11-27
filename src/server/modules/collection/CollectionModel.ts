import Model from '../Model';

export default class CollectionModel extends Model {
  private id: string;
  private websiteId: string;
  private name: string;
  private callHook: boolean;
  private title: string | null;
  private slug: string | null;
  private backdatingEnabled: boolean;

  constructor(
    id: string,
    websiteId: string,
    name: string,
    callHook: boolean,
    title: string | null,
    slug: string | null,
    backdatingEnabled: boolean
  ) {
    super();
    this.id = id;
    this.websiteId = websiteId;
    this.name = name;
    this.callHook = callHook;
    this.title = title;
    this.slug = slug;
    this.backdatingEnabled = backdatingEnabled;
  }

  getId() {
    return this.id;
  }

  getWebsiteId() {
    return this.websiteId;
  }

  getName() {
    return this.name;
  }

  shouldCallHook() {
    return this.callHook;
  }

  getTitle() {
    return this.title;
  }

  getSlug() {
    return this.slug;
  }

  isBackdatingEnabled() {
    return this.backdatingEnabled;
  }
}
