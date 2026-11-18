export default class CollectionInputDTO {
  readonly id: string;
  readonly collectionId: string;
  readonly input: string;
  readonly name: string;
  readonly fieldName: string;
  readonly description: string;
  readonly required: boolean;
  readonly inputConfig: Record<string, any>;

  constructor(
    id: string,
    collectionId: string,
    input: string,
    name: string,
    fieldName: string,
    description: string,
    required: boolean,
    inputConfig: Record<string, any>
  );

  static fromJSON(json: any): CollectionInputDTO;
  clone(): CollectionInputDTO;
  toJSON(): {
    id: string
    collectionId: string
    input: string
    name: string
    fieldName: string
    description: string
    required: boolean
    inputConfig: Record<string, any>
  };
}
