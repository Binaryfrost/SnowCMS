import DTO from '../DTO';

export default class UpdateCollectionDTO extends DTO {
  /** @type {string} */
  #name;
  /** @type {boolean} */
  #callHook;
  /** @type {string} */
  #title;
  /** @type {string} */
  #slug;
  /** @type {boolean} */
  #backdatingEnabled;

  /**
   * @param {string} name
   * @param {boolean} callHook
   * @param {string} title
   * @param {string} slug
   * @param {boolean} backdatingEnabled
   */
  constructor(name, callHook, title, slug, backdatingEnabled) {
    super();
    this.name = name;
    this.callHook = callHook;
    this.title = title;
    this.slug = slug;
    this.backdatingEnabled = backdatingEnabled;
  }

  get name() {
    return this.#name;
  }

  set name(name) {
    this.#name = this.validator(name, 'name').required().string().getValue();
  }

  get callHook() {
    return this.#callHook;
  }

  set callHook(callHook) {
    this.#callHook = this.validator(callHook, 'callHook').required().boolean().getValue();
  }

  get title() {
    return this.#title;
  }

  set title(title) {
    this.#title = this.validator(title, 'title').required().string().getValue();
  }

  get slug() {
    return this.#slug;
  }

  set slug(slug) {
    this.#slug = this.validator(slug, 'slug').required().string().getValue();
  }

  get backdatingEnabled() {
    return this.#backdatingEnabled;
  }

  set backdatingEnabled(backdatingEnabled) {
    this.#backdatingEnabled = this.validator(backdatingEnabled, 'backdatingEnabled').required().boolean().getValue();
  }

  clone() {
    return new UpdateCollectionDTO(
      this.name,
      this.callHook,
      this.title,
      this.slug,
      this.backdatingEnabled
    );
  }

  static fromJSON(json) {
    return new UpdateCollectionDTO(
      json.name,
      json.callHook,
      json.title,
      json.slug,
      json.backdatingEnabled
    );
  }

  toJSON() {
    return {
      name: this.name,
      callHook: this.callHook,
      title: this.title,
      slug: this.slug,
      backdatingEnabled: this.backdatingEnabled
    };
  }
}
