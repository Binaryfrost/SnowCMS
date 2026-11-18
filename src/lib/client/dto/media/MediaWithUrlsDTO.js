import MediaDTO from './MediaDTO.js';

export default class MediaWithUrlsDTO extends MediaDTO {
  #url;
  #thumbUrl;

  /**
   * @param {string} id Media ID
   * @param {string} websiteId Website ID
   * @param {string} origFileName Original file name
   * @param {string} fileName File name
   * @param {number} fileSize File size
   * @param {string} fileType File type
   * @param {string | null} thumbName Thumb name
   * @param {number} timestamp Timestamp
   * @param {string} url Public URL
   * @param {string | null} thumbUrl Public thumbnail URL
   */
  constructor(
    id,
    websiteId,
    origFileName,
    fileName,
    fileSize,
    fileType,
    thumbName,
    timestamp,
    url,
    thumbUrl
  ) {
    super(id, websiteId, origFileName, fileName, fileSize, fileType, thumbName, timestamp);
    this.#url = this.validator(url, 'url').required().string().getValue();
    this.#thumbUrl = this.validator(thumbUrl, 'thumbUrl').string().getValue();
  }

  get url() {
    return this.#url;
  }

  get thumbUrl() {
    return this.#thumbUrl;
  }

  clone() {
    return new MediaWithUrlsDTO(
      this.id,
      this.websiteId,
      this.origFileName,
      this.fileName,
      this.fileSize,
      this.fileType,
      this.thumbName,
      this.timestamp,
      this.url,
      this.thumbUrl
    );
  }

  static fromJSON(json) {
    return new MediaWithUrlsDTO(
      json.id,
      json.websiteId,
      json.origFileName,
      json.fileName,
      json.fileSize,
      json.fileType,
      json.thumbName,
      json.timestamp,
      json.url,
      json.thumbUrl
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
      thumbUrl: this.thumbUrl
    };
  }
}
