export default class MediaConfigDTO {
  readonly maxSize: number;
  readonly maxStorage: number;
  readonly usedStorage: number;

  constructor(maxSize: number, maxStorage: number, usedStorage: number);

  static fromJSON(json: any): MediaConfigDTO;
  clone(): MediaConfigDTO;
  toJSON(): {
    maxSize: number
    maxStorage: number
    usedStorage: number
  };
}
