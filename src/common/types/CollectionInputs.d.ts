export interface CollectionInput {
  id: string
  collectionId:string
  name: string
  description: string
  fieldName: string
  input: string
  inputConfig: string
}

// The order is only needed server-side for sorting purposes
export interface DatabaseCollectionInput extends CollectionInput {
  order: number
}
