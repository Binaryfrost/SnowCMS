export interface CollectionEntry {
  id: string
  collectionId: string
  createdAt: number
  updatedAt: number
}

export interface CollectionEntryWithTitle extends CollectionEntry {
  title?: string
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
