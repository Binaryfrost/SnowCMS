export default class CollectionInputDTO {
  get id(): string;
  get collectionId(): string;
  get input(): string;
  get name(): string;
  set name(value: string);
  get fieldName(): string;
  set fieldName(value: string);
  get description(): string;
  set description(value: string);
  get required(): boolean;
  set required(value: boolean);
  get inputConfig(): Record<string, any>;
  set inputConfig(value: Record<string, any>);

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
