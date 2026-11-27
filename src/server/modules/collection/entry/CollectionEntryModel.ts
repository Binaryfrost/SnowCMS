import Model from '../../Model';

export class CollectionEntryInputModel extends Model {
  private entryId: string;
  private inputId: string;
  private data: string;

  constructor(entryId: string, inputId: string, data: string) {
    super();
    this.entryId = entryId;
    this.inputId = inputId;
    this.data = data;
  }

  getEntryId() {
    return this.entryId;
  }

  getInputId() {
    return this.inputId;
  }

  getData() {
    return this.data;
  }
}

export default class CollectionEntryModel extends Model {
  private id: string;
  private collectionId: string;
  private createdAt: number;
  private updatedAt: number;

  constructor(id: string, collectionId: string, createdAt: number, updatedAt: number) {
    super();
    this.id = id;
    this.collectionId = collectionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  getId() {
    return this.id;
  }

  getCollectionId() {
    return this.collectionId;
  }

  getCreatedAt() {
    return this.createdAt;
  }

  getUpdatedAt() {
    return this.updatedAt;
  }
}

export class CollectionEntryWithMetadataModel extends CollectionEntryModel {
  private title: string | null;
  private slug: string | null;

  constructor(
    id: string,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    title: string | null,
    slug: string | null
  ) {
    super(id, collectionId, createdAt, updatedAt);
    this.title = title;
    this.slug = slug;
  }

  getTitle() {
    return this.title;
  }

  getSlug() {
    return this.slug;
  }
}
