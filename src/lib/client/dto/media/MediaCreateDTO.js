import DTO from '../DTO.js';

/**
 * The metadata for a Media item being created, before it is confirmed and
 * persisted. Passed to before/after media create hooks.
 */
export default class MediaCreateDTO extends DTO {
  #id;
  #websiteId;
  #origFileName;
  #fileName;
  #fileSize;
  #fileType;
  #thumbName;

  /**
   * @param {string} id
   * @param {string} websiteId
   * @param {string} origFileName
   * @param {string} fileName
   * @param {number} fileSize
   * @param {string} fileType
   * @param {string | null} thumbName
   */
  constructor(id, websiteId, origFileName, fileName, fileSize, fileType, thumbName) {
    super();
    // ID, website ID, size, and type are not mutable, so validation is done here
    this.#id = this.validator(id, 'id').required().string().getValue();
    this.#websiteId = this.validator(websiteId, 'websiteId').required().string().getValue();
    this.#fileSize = this.validator(fileSize, 'fileSize').required().number().getValue();
    this.#fileType = this.validator(fileType, 'fileType').required().string().getValue();

    this.origFileName = origFileName;
    this.fileName = fileName;
    this.thumbName = thumbName;
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

  set origFileName(origFileName) {
    this.#origFileName = this.validator(origFileName, 'origFileName').required()
      .string().getValue();
  }

  get fileName() {
    return this.#fileName;
  }

  set fileName(fileName) {
    this.#fileName = this.validator(fileName, 'fileName').required().string().getValue();
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

  set thumbName(thumbName) {
    this.#thumbName = this.validator(thumbName, 'thumbName').string().getValue();
  }

  clone() {
    return new MediaCreateDTO(
      this.id,
      this.websiteId,
      this.origFileName,
      this.fileName,
      this.fileSize,
      this.fileType,
      this.thumbName
    );
  }

  static fromJSON(json) {
    return new MediaCreateDTO(
      json.id,
      json.websiteId,
      json.origFileName,
      json.fileName,
      json.fileSize,
      json.fileType,
      json.thumbName
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
      thumbName: this.thumbName
    };
  }
}
