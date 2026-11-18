import DTO from '../DTO.js';

export default class CollectionDTO extends DTO {
  #id;
  #websiteId;
  #name;
  #callHook;
  #title;
  #slug;
  #backdatingEnabled;

  /**
   * @param {string} id
   * @param {string} websiteId
   * @param {string} name
   * @param {boolean} callHook
   * @param {string | null} title
   * @param {string | null} slug
   * @param {boolean} backdatingEnabled
   */
  constructor(id, websiteId, name, callHook, title, slug, backdatingEnabled) {
    super();
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#websiteId = this.validator(websiteId, 'websiteId').required().string().getValue();
    this.#name = this.validator(name, 'name').required().string().getValue();
    this.#callHook = this.validator(callHook, 'callHook').required().boolean().getValue();
    this.#title = this.validator(title, 'title').string().getValue();
    this.#slug = this.validator(slug, 'slug').string().getValue();
    this.#backdatingEnabled = this.validator(backdatingEnabled, 'backdatingEnabled').required().boolean().getValue();
  }

  get id() {
    return this.#id;
  }

  get websiteId() {
    return this.#websiteId;
  }

  get name() {
    return this.#name;
  }

  get callHook() {
    return this.#callHook;
  }

  get title() {
    return this.#title;
  }

  get slug() {
    return this.#slug;
  }

  get backdatingEnabled() {
    return this.#backdatingEnabled;
  }

  clone() {
    return new CollectionDTO(
      this.id,
      this.websiteId,
      this.name,
      this.callHook,
      this.title,
      this.slug,
      this.backdatingEnabled
    );
  }

  static fromJSON(json) {
    return new CollectionDTO(
      json.id,
      json.websiteId,
      json.name,
      json.callHook,
      json.title,
      json.slug,
      json.backdatingEnabled
    );
  }

  toJSON() {
    return {
      id: this.id,
      websiteId: this.websiteId,
      name: this.name,
      callHook: this.callHook,
      title: this.title,
      slug: this.slug,
      backdatingEnabled: this.backdatingEnabled
    };
  }
}
