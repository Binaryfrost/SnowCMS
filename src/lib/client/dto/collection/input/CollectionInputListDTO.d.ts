import type CollectionInputDTO from './CollectionInputDTO';

export default class CollectionInputListDTO {
  readonly inputs: CollectionInputDTO[];

  constructor(inputs: CollectionInputDTO[]);

  static fromJSON(json: any): CollectionInputListDTO;
  clone(): CollectionInputListDTO;
  toJSON(): {
    inputs: ReturnType<CollectionInputDTO['toJSON']>[]
  };
}
