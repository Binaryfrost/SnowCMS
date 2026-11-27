import Model from '../Model';

export default class MediaModel extends Model {
  private id: string;
  private websiteId: string;
  private origFileName: string;
  private fileName: string;
  private fileSize: number;
  private fileType: string;
  private thumbName: string | null;
  private timestamp: number;

  constructor(
    id: string,
    websiteId: string,
    origFileName: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    timestamp: number,
    thumbName?: string
  ) {
    super();
    this.id = id;
    this.websiteId = websiteId;
    this.origFileName = origFileName;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.fileType = fileType;
    this.timestamp = timestamp;
    this.thumbName = thumbName || null;
  }

  getId() {
    return this.id;
  }

  getWebsiteId() {
    return this.websiteId;
  }

  getOrigFileName() {
    return this.origFileName;
  }

  getFileName() {
    return this.fileName;
  }

  setFileName(name: string) {
    this.fileName = name;
  }

  getFileSize() {
    return this.fileSize;
  }

  getFileType() {
    return this.fileType;
  }

  getThumbName() {
    return this.thumbName;
  }

  getTimestamp() {
    return this.timestamp;
  }
}
