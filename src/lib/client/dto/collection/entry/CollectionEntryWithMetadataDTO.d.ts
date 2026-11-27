import CollectionEntryDTO from './CollectionEntryDTO';

export default class CollectionEntryWithMetadataDTO extends CollectionEntryDTO {
  readonly title: string | null;
  readonly slug: string | null;

  constructor(
    id: string,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    title: string | null,
    slug: string | null
  );

  static fromJSON(json: any): CollectionEntryWithMetadataDTO;
  clone(): CollectionEntryWithMetadataDTO;
  toJSON(): {
    id: string
    collectionId: string
    createdAt: number
    updatedAt: number
    title: string | null
    slug: string | null
  };
}
