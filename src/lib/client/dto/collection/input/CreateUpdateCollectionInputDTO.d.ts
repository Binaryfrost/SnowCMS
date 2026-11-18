import type CollectionInputDTO from './CollectionInputDTO';

export default class CreateUpdateCollectionInputDTO {
  name: string;
  description: string | null;
  fieldName: string;
  input: string;
  inputConfig: Record<string, any>;
  required: boolean;

  constructor(
    name: string,
    description: string | null,
    fieldName: string,
    input: string,
    inputConfig: Record<string, any>,
    required: boolean
  );

  static fromJSON(json: any): CreateUpdateCollectionInputDTO;
  clone(): CreateUpdateCollectionInputDTO;
  toJSON(): {
    name: string
    description: string | null
    fieldName: string
    input: string
    inputConfig: Record<string, any>
    required: boolean
  };
}
