import Model from '../../../Model';

export default class CollectionEntryDraftModel extends Model {
  private id: string;
  private entryId: string | null;
  private collectionId: string;
  private createdAt: number;
  private updatedAt: number;
  private data: Record<string, string>;

  constructor(
    id: string,
    entryId: string | null,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    data: Record<string, string>
  ) {
    super();
    this.id = id;
    this.entryId = entryId;
    this.collectionId = collectionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.data = data;
  }

  getId() {
    return this.id;
  }

  getEntryId() {
    return this.entryId;
  }

  setEntryId(entryId: string | null) {
    this.entryId = entryId;
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

  setUpdatedAt(updatedAt: number) {
    this.updatedAt = updatedAt;
  }

  getData() {
    return this.data;
  }

  setData(data: Record<string, string>) {
    this.data = data;
  }
}

export class CollectionEntryDraftSummaryModel extends Model {
  private id: string;
  private entryId: string | null;
  private collectionId: string;
  private createdAt: number;
  private updatedAt: number;
  private title: string | null;

  constructor(
    id: string,
    entryId: string | null,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    title: string | null
  ) {
    super();
    this.id = id;
    this.entryId = entryId;
    this.collectionId = collectionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.title = title;
  }

  getId() {
    return this.id;
  }

  getEntryId() {
    return this.entryId;
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

  getTitle() {
    return this.title;
  }
}
