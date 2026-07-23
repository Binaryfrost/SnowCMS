/*
  TODO: Delete type file (and all type files in `src/common/types`)
  as DTOs serve the same purpose and offer more functionality.
*/

export interface CollectionInputSettings {
  name: string
  fieldName: string
  description: string
  required: boolean
  inputConfig: Record<string, any>
}

export interface CollectionInput extends CollectionInputSettings {
  id: string
  collectionId: string
  input: string
}

// The order is only needed server-side for sorting purposes
export interface DatabaseCollectionInput extends CollectionInput {
  order: number
}
