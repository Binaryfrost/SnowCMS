import DTO from '../DTO.js';

export default class MediaDTO extends DTO {
  #id;
  #websiteId;
  #origFileName;
  #fileName;
  #fileSize;
  #fileType;
  #thumbName;
  #timestamp;

  /**
   * @param {string} id Media ID
   * @param {string} websiteId Website ID
   * @param {string} origFileName Original file name
   * @param {string} fileName File name
   * @param {number} fileSize File size
   * @param {string} fileType File type
   * @param {string | null} thumbName Thumb name
   * @param {number} timestamp Timestamp
   */
  constructor(id, websiteId, origFileName, fileName, fileSize, fileType, thumbName, timestamp) {
    super();
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#websiteId = this.validator(websiteId, 'websiteId').required().string().getValue();
    this.#origFileName = this.validator(origFileName, 'origFileName').required().string().getValue();
    this.#fileName = this.validator(fileName, 'fileName').required().string().getValue();
    this.#fileSize = this.validator(fileSize, 'fileSize').required().number().getValue();
    this.#fileType = this.validator(fileType, 'fileType').required().string().getValue();
    this.#thumbName = this.validator(thumbName, 'thumbName').string().getValue();
    this.#timestamp = this.validator(timestamp, 'timestamp').required().number().getValue();
  }

  get id() {
    return this.#id;
  }

  get websiteId() {
    return this.#websiteId;
  }

  get origFileName() {
    return this.#origFileName;
  }

  get fileName() {
    return this.#fileName;
  }

  get fileSize() {
    return this.#fileSize;
  }

  get fileType() {
    return this.#fileType;
  }

  get thumbName() {
    return this.#thumbName;
  }

  get timestamp() {
    return this.#timestamp;
  }

  clone() {
    return new MediaDTO(
      this.id,
      this.websiteId,
      this.origFileName,
      this.fileName,
      this.fileSize,
      this.fileType,
      this.thumbName,
      this.timestamp
    );
  }

  static fromJSON(json) {
    return new MediaDTO(
      json.id,
      json.websiteId,
      json.origFileName,
      json.fileName,
      json.fileSize,
      json.fileType,
      json.thumbName,
      json.timestamp
    );
  }

  toJSON() {
    return {
      id: this.id,
      websiteId: this.websiteId,
      origFileName: this.origFileName,
      fileName: this.fileName,
      fileSize: this.fileSize,
      fileType: this.fileType,
      thumbName: this.thumbName,
      timestamp: this.timestamp
    };
  }
}
