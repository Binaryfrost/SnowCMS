export interface CollectionInput {
  id: string
  collectionId: string
  input: string
  name: string
  fieldName: string
  description: string
  required: boolean
  inputConfig: Record<string, any>
}
