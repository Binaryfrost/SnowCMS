export interface CollectionEntry {
  id: string
  collectionId: string
  createdAt: number
  updatedAt: number
}

export interface CollectionEntryWithMetadata extends CollectionEntry {
  title?: string
  slug?: string
}

export interface CollectionEntryInputs {
  entryId: string
  inputId: string
  data: string
}

export interface CollectionEntryWithData extends CollectionEntry {
  data: CollectionEntryInputs[]
}

export interface CollectionEntryWithRenderedData<T = Record<string, any>> extends CollectionEntry {
  data: T
}

export interface CollectionEntryDraft {
  id: string
  entryId?: string
  collectionId: string
  createdAt: number
  updatedAt: number
  data: Record<string, string>
}

export interface CollectionEntryDraftWithData extends CollectionEntry {
  entryId?: string
  data: Omit<CollectionEntryInputs, 'entryId'>[]
}

export interface CollectionEntryDraftSummary extends Omit<CollectionEntryDraft, 'data'> {
  title?: string
}
