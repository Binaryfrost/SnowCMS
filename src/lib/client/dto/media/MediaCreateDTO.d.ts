export default class MediaCreateDTO {
  get id(): string;
  get websiteId(): string;
  get origFileName(): string;
  set origFileName(value: string);
  get fileName(): string;
  set fileName(value: string);
  get fileSize(): number;
  get fileType(): string;
  get thumbName(): string | null;
  set thumbName(value: string | null);

  constructor(
    id: string,
    websiteId: string,
    origFileName: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    thumbName: string | null
  );

  static fromJSON(json: any): MediaCreateDTO;
  clone(): MediaCreateDTO;
  toJSON(): {
    id: string
    websiteId: string
    origFileName: string
    fileName: string
    fileSize: number
    fileType: string
    thumbName: string | null
  };
}
